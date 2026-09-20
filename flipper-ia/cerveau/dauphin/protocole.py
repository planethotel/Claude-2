"""Encodage / decodage du protocole « Ecaille ».

Cote Flipper le meme travail est fait en C dans `fap/lien/protocole.c`. Les
deux implementations doivent rester d'accord : voir `docs/PROTOCOLE.md`.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field

VERSION = 1
LIGNE_MAX = 512

#: Remplacements faits avant le repliage Unicode, pour les signes qui n'ont pas
#: d'equivalent par decomposition.
_REMPLACEMENTS = {
    "’": "'",
    "‘": "'",
    "“": '"',
    "”": '"',
    "–": "-",
    "—": "-",
    "…": "...",
    "«": '"',
    "»": '"',
    "€": "EUR",
    "°": "o",
    "œ": "oe",
    "Œ": "OE",
    "æ": "ae",
    "Æ": "AE",
    "\u00a0": " ",
    "\u202f": " ",
}


def aplatir(texte: str) -> str:
    """Replie un texte francais en ASCII imprimable.

    Les polices embarquees du Flipper (u8g2 `*_tr`) ne contiennent que
    0x20..0x7E : un « é » ne s'affiche pas, il laisse un trou. On desaccentue
    donc ici, une bonne fois, plutot que de s'en apercevoir sur l'ecran.

    >>> aplatir("Éléphant à 433,92 MHz — ça marche ?")
    'Elephant a 433,92 MHz - ca marche ?'
    """
    if not texte:
        return ""

    for avant, apres in _REMPLACEMENTS.items():
        texte = texte.replace(avant, apres)

    decompose = unicodedata.normalize("NFD", texte)
    sans_accent = "".join(c for c in decompose if unicodedata.category(c) != "Mn")

    return "".join(c if 0x20 <= ord(c) <= 0x7E else " " for c in sans_accent)


def _echapper(valeur: str) -> str:
    return valeur.replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n")


def _desechapper(valeur: str) -> str:
    sortie: list[str] = []
    i = 0
    while i < len(valeur):
        c = valeur[i]
        if c == "\\" and i + 1 < len(valeur):
            i += 1
            suite = valeur[i]
            sortie.append({"n": "\n", "t": "\t", "\\": "\\"}.get(suite, suite))
        else:
            sortie.append(c)
        i += 1
    return "".join(sortie)


def encoder(type_trame: str, **champs: object) -> str:
    """Construit une ligne de protocole, `\\n` compris.

    Les valeurs `None` sont omises, les autres converties en texte, repliees en
    ASCII puis echappees.

    >>> encoder("DIRE", texte="Salut", humeur="content")
    'DIRE\\ttexte=Salut\\thumeur=content\\n'
    """
    morceaux = [type_trame]
    for cle, valeur in champs.items():
        if valeur is None:
            continue
        morceaux.append(f"{cle}={_echapper(aplatir(str(valeur)))}")

    ligne = "\t".join(morceaux) + "\n"
    if len(ligne) > LIGNE_MAX:
        ligne = ligne[: LIGNE_MAX - 1] + "\n"
    return ligne


@dataclass
class Trame:
    """Une trame recue du Flipper."""

    type: str
    champs: dict[str, str] = field(default_factory=dict)

    def get(self, cle: str, defaut: str = "") -> str:
        return self.champs.get(cle, defaut)

    def entier(self, cle: str, defaut: int = 0) -> int:
        try:
            return int(self.champs[cle])
        except (KeyError, ValueError):
            return defaut


def decoder(ligne: str) -> Trame:
    """Decoupe une ligne recue en Trame.

    >>> t = decoder("OBJET\\tcat=nfc\\tnom=badge.nfc")
    >>> t.type, t.get("cat"), t.get("nom")
    ('OBJET', 'nfc', 'badge.nfc')
    """
    ligne = ligne.rstrip("\r\n")
    morceaux = ligne.split("\t")

    champs: dict[str, str] = {}
    for morceau in morceaux[1:]:
        if "=" not in morceau:
            continue
        cle, _, valeur = morceau.partition("=")
        champs[cle] = _desechapper(valeur)

    return Trame(type=morceaux[0] if morceaux else "", champs=champs)
