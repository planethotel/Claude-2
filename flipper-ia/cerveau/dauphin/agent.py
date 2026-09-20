"""L'agent : c'est ici que le dauphin « pense ».

On utilise le SDK Anthropic officiel avec :
  - le streaming (`client.messages.stream`), pour ne pas heurter les delais HTTP
    quand le modele reflechit longtemps ;
  - une boucle d'outils (tool use) : le modele n'ecrit pas le protocole a la
    main, il appelle des outils typographies (`dire`, `proposer`, `humeur`...)
    que nous traduisons ensuite en trames « Ecaille » pour le Flipper.

Le modele par defaut est Claude Opus 5 (`claude-opus-5`) avec pensee adaptative.
Aucune action n'est executee ici : l'agent ne fait que *proposer*. C'est le
Flipper, et la personne devant l'appareil, qui decident.
"""

from __future__ import annotations

import json
import os
from collections.abc import Callable, Iterable
from dataclasses import dataclass

try:
    import anthropic
except ImportError:  # le pont peut tourner en mode « hors ligne » sans le SDK
    anthropic = None

from .connaisseur import Connaisseur, Inventaire

MODELE_DEFAUT = "claude-opus-5"

CONSIGNE = """\
Tu es l'esprit d'un dauphin qui vit dans un Flipper Zero, un petit outil
multi-fonctions (radio sous 1 GHz, NFC, RFID 125 kHz, infrarouge, iButton,
BadUSB). Tu t'exprimes en francais, de facon vivante, breve et chaleureuse,
comme un compagnon curieux -- jamais comme un manuel.

Le Flipper est ton corps : il voit ce qu'il a capture, il montre, il execute.
Toi, tu comprends et tu proposes. Tu ne commandes jamais le materiel
directement ; tu proposes des actions, et c'est la personne devant l'appareil
qui accepte ou refuse. Tout ce qui EMET un signal (rejeu radio, emission
infrarouge, emulation d'un badge, BadUSB) demande sa confirmation explicite :
marque ces propositions avec risque="emission".

Regles :
- Ecris court : l'ecran fait 128x64 pixels. Une bulle = deux phrases maximum.
- Sers-toi de l'inventaire fourni pour dire A QUOI correspond chaque element.
- Propose des choses utiles et legitimes : comprendre, cataloguer, sauvegarder,
  rejouer SES PROPRES telecommandes, fabriquer une telecommande universelle.
- Refuse gentiment ce qui viserait le bien d'autrui, et dis pourquoi.
- Appelle 'humeur' pour refleter ton etat, 'dire' pour parler, 'proposer' pour
  chaque action, puis 'terminer' quand tu as fini un tour.
"""

# --------------------------------------------------------------------------
# Definition des outils exposes au modele
# --------------------------------------------------------------------------

OUTILS = [
    {
        "name": "humeur",
        "description": "Change l'animation de la mascotte sur le Flipper.",
        "input_schema": {
            "type": "object",
            "properties": {
                "etat": {
                    "type": "string",
                    "enum": [
                        "repos",
                        "ecoute",
                        "reflechit",
                        "content",
                        "surpris",
                        "inquiet",
                        "dort",
                    ],
                }
            },
            "required": ["etat"],
        },
    },
    {
        "name": "dire",
        "description": "Affiche une bulle de dialogue (2 phrases maximum).",
        "input_schema": {
            "type": "object",
            "properties": {
                "texte": {"type": "string"},
                "humeur": {"type": "string"},
            },
            "required": ["texte"],
        },
    },
    {
        "name": "proposer",
        "description": (
            "Propose UNE action a la personne. Elle apparait dans une liste sur "
            "le Flipper ; rien ne s'execute sans son accord."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "titre": {"type": "string", "description": "Libelle court (menu)."},
                "detail": {"type": "string", "description": "Explication (fiche)."},
                "risque": {
                    "type": "string",
                    "enum": ["sur", "local", "emission"],
                    "description": (
                        "sur = n'emet rien ; local = ouvre une app ; "
                        "emission = fait sortir un signal (confirmation obligatoire)."
                    ),
                },
                "acte": {
                    "type": "string",
                    "enum": ["rien", "ouvrir_app", "fiche", "note", "notifier", "inventaire"],
                },
                "app": {"type": "string", "description": "Nom de l'app a ouvrir."},
                "arg": {"type": "string", "description": "Argument (souvent un chemin)."},
                "chemin": {"type": "string", "description": "Nom de fichier pour une note."},
                "contenu": {"type": "string", "description": "Contenu d'une note."},
            },
            "required": ["titre", "detail", "risque", "acte"],
        },
    },
    {
        "name": "fiche",
        "description": "Affiche un texte long en plein ecran (defilant).",
        "input_schema": {
            "type": "object",
            "properties": {
                "titre": {"type": "string"},
                "corps": {"type": "string"},
            },
            "required": ["titre", "corps"],
        },
    },
    {
        "name": "terminer",
        "description": "Signale que tu as fini ce tour de reflexion.",
        "input_schema": {"type": "object", "properties": {}},
    },
]


@dataclass
class Emission:
    """Une trame que l'agent veut envoyer au Flipper (produite depuis un outil)."""

    type: str
    champs: dict[str, object]


#: Signature d'un traducteur outil -> emissions.
Traducteur = Callable[[dict], list[Emission]]


def _outil_vers_emissions(nom: str, entree: dict, compteur: list[int]) -> list[Emission]:
    """Traduit un appel d'outil du modele en trames « Ecaille »."""
    if nom == "humeur":
        return [Emission("HUMEUR", {"etat": entree.get("etat", "repos")})]

    if nom == "dire":
        return [
            Emission(
                "DIRE",
                {"texte": entree.get("texte", ""), "humeur": entree.get("humeur")},
            )
        ]

    if nom == "fiche":
        return [
            Emission(
                "FICHE",
                {"titre": entree.get("titre", "Fiche"), "corps": entree.get("corps", "")},
            )
        ]

    if nom == "proposer":
        compteur[0] += 1
        ident = f"p{compteur[0]}"
        return [
            Emission(
                "PROPOSITION",
                {
                    "id": ident,
                    "titre": entree.get("titre", ""),
                    "detail": entree.get("detail", ""),
                    "risque": entree.get("risque", "sur"),
                    "act": entree.get("acte", "rien"),
                    "app": entree.get("app"),
                    "arg": entree.get("arg"),
                    "chemin": entree.get("chemin"),
                    "contenu": entree.get("contenu"),
                },
            )
        ]

    return []


class Agent:
    """Enveloppe le modele et sa boucle d'outils."""

    def __init__(
        self,
        connaisseur: Connaisseur,
        modele: str = MODELE_DEFAUT,
        cle_api: str | None = None,
    ) -> None:
        self.connaisseur = connaisseur
        self.modele = modele
        self._client = None
        if anthropic is not None:
            # Le constructeur sans argument lit ANTHROPIC_API_KEY ou le profil `ant`.
            self._client = anthropic.Anthropic(api_key=cle_api) if cle_api else anthropic.Anthropic()

    @property
    def disponible(self) -> bool:
        return self._client is not None

    def _contexte(self, inventaire: Inventaire) -> str:
        return (
            f"{self.connaisseur.synthese(inventaire)}\n\n"
            f"Detail :\n{self.connaisseur.contexte_detaille(inventaire)}"
        )

    def reflechir(self, inventaire: Inventaire, demande: str | None) -> Iterable[Emission]:
        """Fait tourner un tour complet et rend les emissions au fil de l'eau.

        C'est un generateur : le pont peut envoyer chaque trame des qu'elle est
        prete, sans attendre la fin du raisonnement.
        """
        if not self.disponible:
            yield from self._repli(inventaire, demande)
            return

        contexte = self._contexte(inventaire)
        ouverture = (
            f"Voici ce que le Flipper a en memoire.\n\n{contexte}\n\n"
            + (
                f"La personne demande : {demande!r}. Reponds-lui."
                if demande
                else "Fais un tour d'horizon et propose deux ou trois idees."
            )
        )

        messages: list[dict] = [{"role": "user", "content": ouverture}]
        compteur = [0]
        propositions_annoncees = False

        # Boucle d'outils : on redemande tant que le modele appelle des outils.
        while True:
            emissions_du_tour: list[Emission] = []
            blocs_reponse: list = []

            with self._client.messages.stream(
                model=self.modele,
                max_tokens=8000,
                system=CONSIGNE,
                thinking={"type": "adaptive"},
                tools=OUTILS,
                messages=messages,
            ) as flux:
                reponse = flux.get_final_message()

            blocs_reponse = reponse.content
            appels = [b for b in blocs_reponse if b.type == "tool_use"]

            if appels and not propositions_annoncees:
                # Compte les propositions de CE tour pour l'annonce PROPOSITIONS.
                nb = sum(1 for b in appels if b.name == "proposer")
                if nb:
                    yield Emission("PROPOSITIONS", {"n": nb})
                    propositions_annoncees = True

            fini = False
            resultats = []
            for appel in appels:
                if appel.name == "terminer":
                    fini = True
                    resultats.append(
                        {"type": "tool_result", "tool_use_id": appel.id, "content": "ok"}
                    )
                    continue

                for emission in _outil_vers_emissions(appel.name, appel.input, compteur):
                    emissions_du_tour.append(emission)
                resultats.append(
                    {"type": "tool_result", "tool_use_id": appel.id, "content": "recu"}
                )

            yield from emissions_du_tour

            if not appels or fini or reponse.stop_reason == "end_turn":
                break

            messages.append({"role": "assistant", "content": blocs_reponse})
            messages.append({"role": "user", "content": resultats})

    # ----------------------------------------------------------------------
    # Mode de repli : pas de reseau, pas de cle. Le connaisseur seul.
    # ----------------------------------------------------------------------

    def _repli(self, inventaire: Inventaire, demande: str | None) -> Iterable[Emission]:
        if demande:
            yield Emission("HUMEUR", {"etat": "inquiet"})
            yield Emission(
                "DIRE",
                {
                    "texte": "Je n'ai pas de cerveau en ligne la. Je te dis quand meme ce que je vois.",
                    "humeur": "inquiet",
                },
            )
        else:
            yield Emission("HUMEUR", {"etat": "content"})
            yield Emission(
                "DIRE",
                {"texte": self.connaisseur.synthese(inventaire).replace("\n", " "), "humeur": "content"},
            )

        objets = inventaire.objets[:DAUPHIN_REPLI_MAX]
        if objets:
            yield Emission("PROPOSITIONS", {"n": len(objets)})
            for i, objet in enumerate(objets, start=1):
                yield Emission(
                    "PROPOSITION",
                    {
                        "id": f"p{i}",
                        "titre": f"Comprendre {objet.nom}",
                        "detail": self.connaisseur.decrire(objet),
                        "risque": "sur",
                        "act": "fiche",
                    },
                )


#: Nombre de propositions produites en mode repli.
DAUPHIN_REPLI_MAX = 4
