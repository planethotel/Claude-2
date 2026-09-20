"""Le pont : relie le port serie du Flipper a l'agent.

Il lit les trames « Ecaille » qui arrivent du Flipper, met a jour l'inventaire,
et declenche l'agent quand il le faut (arrivee de l'inventaire, question de la
personne). Les emissions de l'agent repartent vers le Flipper.

Dependance optionnelle : `pyserial`. Sans lui, on peut toujours faire tourner
la logique via un canal en memoire (voir `PontMemoire`), ce dont se servent les
tests.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Iterator

from .agent import Agent, Emission
from .connaisseur import Connaisseur, Inventaire, Objet
from .protocole import Trame, decoder, encoder

logger = logging.getLogger("dauphin.pont")


class Canal:
    """Interface d'un canal de communication ligne a ligne."""

    def lignes(self) -> Iterator[str]:
        raise NotImplementedError

    def envoyer(self, ligne: str) -> None:
        raise NotImplementedError

    def fermer(self) -> None:
        pass


class CanalSerie(Canal):
    """Canal au-dessus d'un port serie (USB CDC canal 1, ou UART)."""

    def __init__(self, port: str, debit: int = 115200, timeout: float = 0.2) -> None:
        import serial  # importe seulement si on s'en sert

        self._serie = serial.Serial(port, debit, timeout=timeout)
        self._reste = b""

    def lignes(self) -> Iterator[str]:
        while True:
            morceau = self._serie.readline()
            if not morceau:
                return
            self._reste += morceau
            if self._reste.endswith(b"\n"):
                ligne = self._reste.decode("ascii", errors="replace")
                self._reste = b""
                yield ligne

    def envoyer(self, ligne: str) -> None:
        self._serie.write(ligne.encode("ascii", errors="replace"))
        self._serie.flush()

    def fermer(self) -> None:
        self._serie.close()


class Pont:
    """Orchestration : trames entrantes -> agent -> trames sortantes."""

    def __init__(self, canal: Canal, agent: Agent) -> None:
        self.canal = canal
        self.agent = agent
        self.inventaire = Inventaire()
        self._objets_attendus = 0

    def _emettre(self, emission: Emission) -> None:
        ligne = encoder(emission.type, **emission.champs)
        logger.debug("-> %s", ligne.rstrip())
        self.canal.envoyer(ligne)

    def _lancer_agent(self, demande: str | None) -> None:
        try:
            for emission in self.agent.reflechir(self.inventaire, demande):
                self._emettre(emission)
        except Exception as erreur:  # le pont ne doit jamais tomber a cause du modele
            logger.exception("l'agent a echoue")
            self._emettre(Emission("HUMEUR", {"etat": "inquiet"}))
            self._emettre(Emission("ERREUR", {"texte": f"Souci du cerveau : {erreur}"}))

    def traiter(self, trame: Trame) -> None:
        """Traite une trame venue du Flipper."""
        logger.debug("<- %s %s", trame.type, trame.champs)

        if trame.type == "BONJOUR":
            nom = trame.get("nom", "Flipper")
            self._emettre(Emission("HUMEUR", {"etat": "ecoute"}))
            self._emettre(
                Emission("DIRE", {"texte": f"Bonjour {nom}. Montre-moi ce que tu as.", "humeur": "ecoute"})
            )

        elif trame.type == "INVENTAIRE":
            self.inventaire.vider()
            self._objets_attendus = trame.entier("n", 0)
            if self._objets_attendus == 0:
                self._lancer_agent(None)

        elif trame.type == "OBJET":
            self.inventaire.ajouter(
                Objet(
                    categorie=trame.get("cat"),
                    nom=trame.get("nom"),
                    proto=trame.get("proto"),
                    detail=trame.get("detail"),
                    frequence=trame.entier("freq", 0),
                )
            )
            # Inventaire complet : on reflechit.
            if len(self.inventaire.objets) >= self._objets_attendus > 0:
                self._lancer_agent(None)

        elif trame.type == "DEMANDE":
            self._lancer_agent(trame.get("texte"))

        elif trame.type == "RESULTAT":
            ok = trame.get("ok") == "1"
            logger.info("resultat %s : %s (%s)", trame.get("id"), ok, trame.get("detail"))

        elif trame.type == "REFUS":
            logger.info("refus %s : %s", trame.get("id"), trame.get("motif"))

        elif trame.type == "POULS":
            logger.debug("pouls batt=%s charge=%s", trame.get("batt"), trame.get("charge"))

        elif trame.type == "AUREVOIR":
            logger.info("le Flipper se deconnecte")

    def boucle(self) -> None:
        """Boucle principale : lit le canal jusqu'a sa fermeture."""
        logger.info("pont demarre (agent %s)", "en ligne" if self.agent.disponible else "hors ligne")
        try:
            while True:
                recu = False
                for ligne in self.canal.lignes():
                    recu = True
                    self.traiter(decoder(ligne))
                if not recu:
                    time.sleep(0.05)
        except KeyboardInterrupt:
            logger.info("arret demande")
        finally:
            self.canal.fermer()


def construire(port: str | None, modele: str | None = None) -> Pont:
    """Fabrique un pont serie pret a tourner."""
    from .agent import MODELE_DEFAUT

    connaisseur = Connaisseur()
    agent = Agent(connaisseur, modele=modele or MODELE_DEFAUT)
    canal = CanalSerie(port) if port else _detecter_canal()
    return Pont(canal, agent)


def _detecter_canal() -> Canal:
    """Trouve le premier port serie qui ressemble a un Flipper."""
    import serial.tools.list_ports

    for infos in serial.tools.list_ports.comports():
        texte = f"{infos.description} {infos.manufacturer or ''}".lower()
        if "flipper" in texte or "cdc" in texte:
            logger.info("Flipper trouve sur %s", infos.device)
            return CanalSerie(infos.device)
    raise RuntimeError("aucun port serie Flipper trouve : precise --port")
