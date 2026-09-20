"""Point d'entree du cerveau : `python -m dauphin`.

Exemples :
    python -m dauphin --port /dev/ttyACM1
    python -m dauphin                       # detection automatique du port
    python -m dauphin --demo                # sans Flipper : joue une session type
"""

from __future__ import annotations

import argparse
import logging
import sys


def main(argv: list[str] | None = None) -> int:
    parseur = argparse.ArgumentParser(description=__doc__)
    parseur.add_argument("--port", help="port serie du Flipper (ex : /dev/ttyACM1, COM5)")
    parseur.add_argument("--modele", help="identifiant du modele Anthropic")
    parseur.add_argument("--demo", action="store_true", help="session simulee, sans materiel")
    parseur.add_argument("-v", "--verbeux", action="store_true", help="journal detaille")
    args = parseur.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbeux else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    if args.demo:
        from .demo import jouer_demo

        return jouer_demo(modele=args.modele)

    from .pont import construire

    try:
        pont = construire(args.port, args.modele)
    except RuntimeError as erreur:
        print(f"Erreur : {erreur}", file=sys.stderr)
        return 1

    pont.boucle()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
