"""Tests du filet de securite de la boucle d'outils (agent.reflechir).

Ces deux comportements sont responsables d'un "chargement infini" cote
Flipper si le modele ne cooperait pas parfaitement : une reponse en texte
libre sans outil (silencieusement perdue avant le correctif), et une boucle
d'outils sans fin (aucun plafond avant le correctif). Les deux sont rejoues
ici avec un faux client, sans reseau ni cle API.
"""

import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dauphin.agent import TOURS_MAX, Agent
from dauphin.connaisseur import Connaisseur, Inventaire
from dauphin.protocole import decoder


class _BlocTexte:
    type = "text"

    def __init__(self, texte):
        self.text = texte


class _BlocOutil:
    type = "tool_use"

    def __init__(self, nom, entree, ident="t1"):
        self.name = nom
        self.input = entree
        self.id = ident


class _Reponse:
    def __init__(self, content, stop_reason="tool_use"):
        self.content = content
        self.stop_reason = stop_reason


class _Flux:
    def __init__(self, reponse):
        self._reponse = reponse

    def __enter__(self):
        return self

    def __exit__(self, *_exc):
        return False

    def get_final_message(self):
        return self._reponse


class _ClientFactice:
    """Rejoue une suite fixe de reponses, une par appel a .stream()."""

    def __init__(self, reponses):
        self._reponses = list(reponses)
        self.appels = 0
        self.messages = SimpleNamespace(stream=self._stream)

    def _stream(self, **_kwargs):
        self.appels += 1
        # Rejoue la derniere reponse indefiniment si la liste est plus courte
        # que ce que la boucle consomme (utile pour simuler un modele qui ne
        # conclut jamais).
        reponse = self._reponses[min(self.appels, len(self._reponses)) - 1]
        return _Flux(reponse)


def _agent_avec_client(client) -> Agent:
    agent = Agent(Connaisseur())
    agent._client = client
    return agent


def test_reponse_texte_libre_sans_outil_est_quand_meme_transmise():
    """Avant le correctif : 0 appel d'outil -> 0 emission -> bulle bloquee."""
    client = _ClientFactice(
        [_Reponse([_BlocTexte("Voici ma reponse, sans passer par un outil.")], "end_turn")]
    )
    agent = _agent_avec_client(client)

    emissions = list(agent.reflechir(Inventaire(), "une question"))

    trames = [decoder(f"{e.type}\t" + "\t".join(
        f"{k}={v}" for k, v in e.champs.items() if v is not None
    )) for e in emissions]
    assert any(t.type == "DIRE" for t in trames)
    dire = next(t for t in trames if t.type == "DIRE")
    assert "sans passer par un outil" in dire.get("texte")


def test_boucle_sans_fin_est_plafonnee():
    """Le modele n'appelle jamais 'terminer' : la boucle doit s'arreter quand meme."""
    # Chaque tour, le modele ne fait que parler -- jamais 'terminer'.
    reponse_qui_ne_conclut_jamais = _Reponse(
        [_BlocOutil("dire", {"texte": "encore un mot..."})], "tool_use"
    )
    client = _ClientFactice([reponse_qui_ne_conclut_jamais])
    agent = _agent_avec_client(client)

    emissions = list(agent.reflechir(Inventaire(), "une question"))

    # La boucle s'est bien arretee (le test se termine), et pas plus de
    # TOURS_MAX appels reseau n'ont ete faits.
    assert client.appels == TOURS_MAX
    # Et on a quand meme recu quelque chose (les DIRE emis a chaque tour).
    assert len(emissions) > 0


def test_reponse_totalement_vide_declenche_le_filet_de_securite():
    """Un tour sans texte ni outil ne doit jamais repartir les mains vides."""
    client = _ClientFactice([_Reponse([], "end_turn")])
    agent = _agent_avec_client(client)

    emissions = list(agent.reflechir(Inventaire(), "une question"))

    assert any(e.type == "DIRE" for e in emissions)
