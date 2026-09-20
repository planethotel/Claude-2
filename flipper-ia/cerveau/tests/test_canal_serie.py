"""Teste la reconnexion automatique de CanalSerie apres une coupure.

Reproduit le crash reellement observe : le FAP ferme ou reconfigure son USB
(l'utilisateur quitte l'appli sur le Flipper), Windows invalide le port en
plein milieu d'une lecture, pyserial leve SerialException. Avant le
correctif, ça remontait telle quelle et plantait tout le pont.py.
"""

import sys
import time
from pathlib import Path
from unittest.mock import patch

import serial

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dauphin.pont import CanalSerie


class _SerieFactice:
    """Simule un port pyserial qui coupe une fois puis revient."""

    def __init__(self, echoue_a_l_ouverture=0, echoue_a_la_lecture=None):
        self.echoue_a_l_ouverture = echoue_a_l_ouverture
        self.echoue_a_la_lecture = set(echoue_a_la_lecture or [])
        self.ouvertures = 0
        self.lectures = 0
        self.fermetures = 0
        self.lignes_a_lire = [b"BONJOUR\n", b""]

    def readline(self):
        self.lectures += 1
        if self.lectures in self.echoue_a_la_lecture:
            raise serial.SerialException("ClearCommError simule")
        if self.lignes_a_lire:
            return self.lignes_a_lire.pop(0)
        return b""

    def close(self):
        self.fermetures += 1


def _fabrique_serie(factice):
    """Faux constructeur serial.Serial(...) : la toute premiere ouverture (le
    constructeur de CanalSerie) reussit toujours -- seules les RECONNEXIONS
    qui suivent peuvent echouer, comme dans la vraie vie (une ouverture
    initiale ratee est une erreur de configuration, pas une coupure)."""

    def constructeur(_port, _debit, timeout=0.2):
        factice.ouvertures += 1
        if factice.ouvertures > 1 and factice.ouvertures - 1 <= factice.echoue_a_l_ouverture:
            raise serial.SerialException("port pas encore revenu")
        return factice

    return constructeur


def test_reconnexion_apres_coupure_de_lecture():
    factice = _SerieFactice(echoue_a_la_lecture={1})

    with patch("serial.Serial", side_effect=_fabrique_serie(factice)), \
         patch("time.sleep", lambda _s: None):  # pas d'attente reelle dans le test
        canal = CanalSerie("COM5")
        lignes = list(canal.lignes())

    assert lignes == ["BONJOUR\n"]
    assert factice.ouvertures == 2  # l'ouverture initiale + une reconnexion
    assert factice.fermetures >= 1


def test_reconnexion_reessaie_jusqua_ce_que_le_port_revienne():
    factice = _SerieFactice(echoue_a_l_ouverture=2, echoue_a_la_lecture={1})

    with patch("serial.Serial", side_effect=_fabrique_serie(factice)), \
         patch("time.sleep", lambda _s: None):
        canal = CanalSerie("COM5")
        lignes = list(canal.lignes())

    assert lignes == ["BONJOUR\n"]
    # 1 ouverture initiale + 2 tentatives ratees + 1 reussie = 4
    assert factice.ouvertures == 4


def test_envoi_sur_port_casse_ne_leve_pas():
    factice = _SerieFactice()
    factice.write_leve = True

    def write(_data):
        raise serial.SerialException("port ferme")

    factice.write = write

    with patch("serial.Serial", side_effect=_fabrique_serie(factice)):
        canal = CanalSerie("COM5")
        canal.envoyer("DIRE\ttexte=salut\n")  # ne doit pas lever
