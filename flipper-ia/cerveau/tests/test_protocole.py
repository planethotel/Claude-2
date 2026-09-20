"""Tests du protocole : l'aller-retour encoder/decoder, et le repliage ASCII."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dauphin.protocole import aplatir, decoder, encoder


def test_aplatir_accents():
    assert aplatir("Éléphant à côté") == "Elephant a cote"


def test_aplatir_typographie():
    assert aplatir("l'été — c'est « chaud »…") == 'l\'ete - c\'est " chaud "...'


def test_aplatir_degre_et_euro():
    assert aplatir("20° et 5€") == "20o et 5EUR"


def test_aplatir_supprime_non_ascii_restant():
    # Un caractere sans repliage connu devient une espace, jamais un octet > 127.
    resultat = aplatir("emoji \U0001f600 fin")
    assert all(0x20 <= ord(c) <= 0x7E for c in resultat)


def test_encoder_omet_none():
    ligne = encoder("DIRE", texte="salut", humeur=None)
    assert ligne == "DIRE\ttexte=salut\n"


def test_aller_retour():
    ligne = encoder("PROPOSITION", id="p1", titre="Test", risque="emission")
    trame = decoder(ligne)
    assert trame.type == "PROPOSITION"
    assert trame.get("id") == "p1"
    assert trame.get("titre") == "Test"
    assert trame.get("risque") == "emission"


def test_texte_une_ligne():
    # Le protocole tient sur une ligne : tab et saut deviennent des espaces,
    # cote Python comme cote C (aplatir / proto_ascii). Le texte reste lisible
    # a l'ecran et ne casse jamais le decoupage des trames.
    ligne = encoder("DIRE", texte="a\tb\nc")
    assert ligne.count("\n") == 1  # seul le \n final
    trame = decoder(ligne)
    assert trame.get("texte") == "a b c"


def test_echappement_antislash():
    # L'antislash lui-meme, imprimable, doit survivre a l'aller-retour.
    ligne = encoder("DIRE", texte="chemin C:\\dossier")
    trame = decoder(ligne)
    assert trame.get("texte") == "chemin C:\\dossier"


def test_decoder_ligne_vide():
    trame = decoder("\n")
    assert trame.type == ""


def test_entier_defaut():
    trame = decoder("POULS\tbatt=abc\n")
    assert trame.entier("batt", -1) == -1
    assert trame.entier("absent", 7) == 7
