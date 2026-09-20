"""Session simulee, pour voir le cerveau tourner sans Flipper branche.

Un canal en memoire rejoue une arrivee de Flipper, un inventaire, puis une
question, et affiche joliment ce que le cerveau renverrait a l'ecran.
"""

from __future__ import annotations

from collections.abc import Iterator

from .agent import Agent
from .connaisseur import Connaisseur
from .pont import Canal, Pont
from .protocole import decoder


class CanalMemoire(Canal):
    """Canal alimente par un script de trames, qui capture les reponses."""

    def __init__(self, script: list[str]) -> None:
        self._script = list(script)
        self.envoyees: list[str] = []
        self._epuise = False

    def lignes(self) -> Iterator[str]:
        while self._script:
            yield self._script.pop(0)
        self._epuise = True

    def envoyer(self, ligne: str) -> None:
        self.envoyees.append(ligne)

    @property
    def epuise(self) -> bool:
        return self._epuise


SCRIPT_DEMO = [
    "BONJOUR\tv=1\tapp=0.1.0\tnom=Requin\n",
    "INVENTAIRE\tn=3\n",
    "OBJET\tcat=subghz\tnom=portail.sub\tproto=Princeton\tfreq=433920000\n",
    "OBJET\tcat=nfc\tnom=badge_bureau.nfc\tproto=Mifare Classic 1K\tdetail=04A2B3C4\n",
    "OBJET\tcat=infrared\tnom=salon.ir\tproto=NEC\tdetail=Samsung TV\n",
    "DEMANDE\ttexte=A quoi sert le badge du bureau ?\n",
]


def _afficher(ligne: str) -> None:
    trame = decoder(ligne)
    if trame.type == "HUMEUR":
        print(f"  [mascotte: {trame.get('etat')}]")
    elif trame.type == "DIRE":
        print(f"  dauphin> {trame.get('texte')}")
    elif trame.type == "PROPOSITIONS":
        print(f"  --- {trame.get('n')} proposition(s) ---")
    elif trame.type == "PROPOSITION":
        marque = "!" if trame.get("risque") == "emission" else " "
        print(f"  {marque} [{trame.get('id')}] {trame.get('titre')}")
        print(f"       {trame.get('detail')}")
    elif trame.type == "FICHE":
        print(f"  == {trame.get('titre')} ==\n     {trame.get('corps')}")
    elif trame.type == "ERREUR":
        print(f"  !! {trame.get('texte')}")


def jouer_demo(modele: str | None = None) -> int:
    from .agent import MODELE_DEFAUT

    connaisseur = Connaisseur()
    agent = Agent(connaisseur, modele=modele or MODELE_DEFAUT)
    canal = CanalMemoire(SCRIPT_DEMO)
    pont = Pont(canal, agent)

    etat = "en ligne (Claude)" if agent.disponible else "hors ligne (connaisseur seul)"
    print(f"=== Demo IA Dauphin -- cerveau {etat} ===\n")

    deja = 0
    for ligne in canal.lignes():
        trame = decoder(ligne)
        print(f"flipper> {trame.type}  {dict(trame.champs)}")
        pont.traiter(trame)
        for envoyee in canal.envoyees[deja:]:
            _afficher(envoyee)
        deja = len(canal.envoyees)
        print()

    return 0
