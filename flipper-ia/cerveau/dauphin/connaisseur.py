"""Le connaisseur : il donne du sens a l'inventaire du Flipper.

Il charge les fiches de `savoir/` et sait resumer ce que l'appareil a capture.
Ce module n'appelle aucun modele : c'est la memoire factuelle, disponible meme
sans reseau et sans cle API.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

DOSSIER_SAVOIR = Path(__file__).resolve().parent / "savoir"

#: Nom lisible de chaque categorie du Flipper.
CATEGORIES = {
    "subghz": "radio sous 1 GHz",
    "nfc": "carte 13,56 MHz",
    "lfrfid": "badge 125 kHz",
    "infrared": "infrarouge",
    "ibutton": "iButton (contact)",
    "badusb": "clavier automatique (BadUSB)",
}

#: Fichier de savoir associe a chaque categorie.
_FICHIERS = {
    "nfc": "nfc.json",
    "lfrfid": "lfrfid.json",
    "subghz": "subghz.json",
    "infrared": "infrared.json",
}


@dataclass
class Objet:
    """Un element capture, tel que le Flipper nous l'a decrit."""

    categorie: str
    nom: str
    proto: str = ""
    detail: str = ""
    frequence: int = 0

    @property
    def frequence_mhz(self) -> str:
        if not self.frequence:
            return ""
        return f"{self.frequence / 1_000_000:.2f}".rstrip("0").rstrip(".") + " MHz"


@dataclass
class Inventaire:
    """Tout ce que le Flipper a annonce dans une session."""

    objets: list[Objet] = field(default_factory=list)

    def ajouter(self, objet: Objet) -> None:
        self.objets.append(objet)

    def vider(self) -> None:
        self.objets.clear()

    def par_categorie(self) -> dict[str, list[Objet]]:
        groupes: dict[str, list[Objet]] = {}
        for objet in self.objets:
            groupes.setdefault(objet.categorie, []).append(objet)
        return groupes


class Connaisseur:
    """Charge les fiches et interprete un inventaire."""

    def __init__(self, dossier: Path = DOSSIER_SAVOIR) -> None:
        self._savoir: dict[str, dict] = {}
        for categorie, fichier in _FICHIERS.items():
            chemin = dossier / fichier
            if chemin.exists():
                donnees = json.loads(chemin.read_text(encoding="utf-8"))
                donnees.pop("_commentaire", None)
                self._savoir[categorie] = donnees

    def fiche(self, objet: Objet) -> dict | None:
        """Fiche de savoir la plus proche pour un objet, ou None."""
        table = self._savoir.get(objet.categorie)
        if not table:
            return None
        if objet.proto in table:
            return table[objet.proto]
        # Correspondance partielle : "Mifare Classic 1K" -> "Mifare Classic".
        for cle, valeur in table.items():
            if objet.proto and (objet.proto.startswith(cle) or cle in objet.proto):
                return valeur
        return None

    def decrire(self, objet: Objet) -> str:
        """Une phrase disant a quoi correspond l'objet."""
        fiche = self.fiche(objet)
        base = fiche["resume"] if fiche else f"{objet.proto or 'type inconnu'}."
        lieu = objet.frequence_mhz or CATEGORIES.get(objet.categorie, objet.categorie)
        return f"{objet.nom} ({lieu}) : {base}"

    def synthese(self, inventaire: Inventaire) -> str:
        """Vue d'ensemble courte de tout l'inventaire, pour le contexte du modele."""
        groupes = inventaire.par_categorie()
        if not groupes:
            return "L'appareil n'a rien de capture pour l'instant."

        lignes = []
        for categorie, objets in groupes.items():
            nom_cat = CATEGORIES.get(categorie, categorie)
            protos = sorted({o.proto for o in objets if o.proto})
            detail = f" ({', '.join(protos)})" if protos else ""
            lignes.append(f"- {len(objets)} en {nom_cat}{detail}")
        return "Inventaire :\n" + "\n".join(lignes)

    def contexte_detaille(self, inventaire: Inventaire) -> str:
        """Liste complete, une ligne par objet, pour que le modele raisonne dessus."""
        if not inventaire.objets:
            return "(inventaire vide)"
        lignes = []
        for i, objet in enumerate(inventaire.objets):
            fiche = self.fiche(objet)
            note = f" -- {fiche['resume']}" if fiche else ""
            lignes.append(
                f"[{i}] cat={objet.categorie} nom={objet.nom} "
                f"proto={objet.proto or '?'} detail={objet.detail or '?'} "
                f"freq={objet.frequence_mhz or '-'}{note}"
            )
        return "\n".join(lignes)
