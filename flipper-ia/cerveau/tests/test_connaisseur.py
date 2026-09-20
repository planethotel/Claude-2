"""Tests du connaisseur : correspondance des fiches et syntheses."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dauphin.connaisseur import Connaisseur, Inventaire, Objet


def test_correspondance_partielle():
    c = Connaisseur()
    fiche = c.fiche(Objet("nfc", "x.nfc", "Mifare Classic 1K"))
    assert fiche is not None
    assert "NXP" in fiche["resume"]


def test_frequence_mhz():
    assert Objet("subghz", "a.sub", frequence=433920000).frequence_mhz == "433.92 MHz"
    assert Objet("nfc", "a.nfc").frequence_mhz == ""


def test_synthese_vide():
    c = Connaisseur()
    assert "rien" in c.synthese(Inventaire()).lower()


def test_synthese_compte_par_categorie():
    c = Connaisseur()
    inv = Inventaire()
    inv.ajouter(Objet("nfc", "a.nfc", "Mifare Classic 1K"))
    inv.ajouter(Objet("nfc", "b.nfc", "NTAG/Ultralight"))
    inv.ajouter(Objet("subghz", "c.sub", "Princeton"))
    synth = c.synthese(inv)
    assert "2 en carte 13,56 MHz" in synth
    assert "1 en radio sous 1 GHz" in synth


def test_decrire_inconnu():
    c = Connaisseur()
    texte = c.decrire(Objet("subghz", "mystere.sub", "ProtoInexistant", frequence=868000000))
    assert "mystere.sub" in texte
    assert "868 MHz" in texte
