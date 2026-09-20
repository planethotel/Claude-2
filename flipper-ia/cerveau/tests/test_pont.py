"""Tests du pont : le mode repli produit des trames coherentes et bornees."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dauphin.agent import Agent
from dauphin.connaisseur import Connaisseur
from dauphin.demo import SCRIPT_DEMO, CanalMemoire
from dauphin.pont import Pont
from dauphin.protocole import decoder


def _pont_hors_ligne() -> tuple[Pont, CanalMemoire]:
    connaisseur = Connaisseur()
    agent = Agent(connaisseur)
    agent._client = None  # on force le mode repli, meme si une cle traine
    canal = CanalMemoire(list(SCRIPT_DEMO))
    return Pont(canal, agent), canal


def test_session_complete_produit_des_propositions():
    pont, canal = _pont_hors_ligne()
    for ligne in list(canal.lignes()):
        pont.traiter(decoder(ligne))

    types = [decoder(l).type for l in canal.envoyees]
    assert "DIRE" in types
    assert "PROPOSITION" in types
    # Le mode repli ne propose jamais d'emission sans savoir : tout est "sur".
    for ligne in canal.envoyees:
        t = decoder(ligne)
        if t.type == "PROPOSITION":
            assert t.get("risque") == "sur"


def test_inventaire_reconstruit():
    pont, canal = _pont_hors_ligne()
    for ligne in list(canal.lignes()):
        pont.traiter(decoder(ligne))
    assert len(pont.inventaire.objets) == 3
    assert pont.inventaire.objets[0].nom == "portail.sub"


def test_annonce_coherente_avec_propositions():
    pont, canal = _pont_hors_ligne()
    for ligne in list(canal.lignes()):
        pont.traiter(decoder(ligne))

    trames = [decoder(l) for l in canal.envoyees]
    # Chaque annonce PROPOSITIONS n doit etre suivie d'exactement n PROPOSITION.
    i = 0
    while i < len(trames):
        if trames[i].type == "PROPOSITIONS":
            attendu = trames[i].entier("n")
            suivantes = 0
            j = i + 1
            while j < len(trames) and trames[j].type == "PROPOSITION":
                suivantes += 1
                j += 1
            assert suivantes == attendu
            i = j
        else:
            i += 1
