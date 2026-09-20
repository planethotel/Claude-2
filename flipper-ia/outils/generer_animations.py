#!/usr/bin/env python3
"""Genere les animations de la mascotte pour le FAP.

Chaque humeur devient un dossier `fap/images/dauphin_<humeur>/` contenant les
images `frame_XX.png` et un fichier `frame_rate`. Le compilateur d'assets du
firmware en fait une icone animee nommee `A_dauphin_<humeur>`.

Convention : on dessine en **noir sur blanc**, le noir devient un pixel allume
sur l'ecran du Flipper (le firmware convertit puis inverse).

    python3 outils/generer_animations.py [--sortie fap/images]
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw

TAILLE = 34
NOIR = 0
BLANC = 255


def nouvelle_image() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("L", (TAILLE, TAILLE), BLANC)
    return image, ImageDraw.Draw(image)


def dessiner_dauphin(
    d: ImageDraw.ImageDraw,
    dy: int = 0,
    queue: int = 0,
    oeil: str = "ouvert",
    bouche: str = "neutre",
) -> None:
    """Dauphin de profil, tourne vers la gauche.

    dy      decalage vertical du corps (respiration, saut)
    queue   decalage vertical du bout de la queue (nage)
    oeil    ouvert | ferme | grand
    bouche  neutre | sourire | moue
    """
    y = dy

    # Corps
    d.ellipse((3, 12 + y, 27, 26 + y), fill=NOIR)

    # Museau
    d.polygon([(0, 21 + y), (11, 16 + y), (11, 23 + y)], fill=NOIR)

    # Aileron dorsal
    d.polygon([(14, 13 + y), (19, 5 + y), (22, 13 + y)], fill=NOIR)

    # Nageoire pectorale
    d.polygon([(11, 22 + y), (14, 29 + y), (18, 23 + y)], fill=NOIR)

    # Queue : le bout bouge
    d.polygon(
        [
            (24, 15 + y),
            (33, 10 + y + queue),
            (30, 18 + y + queue // 2),
            (33, 26 + y + queue),
            (24, 23 + y),
        ],
        fill=NOIR,
    )

    # Oeil, creuse en blanc dans le corps
    if oeil == "ferme":
        d.line((8, 17 + y, 12, 17 + y), fill=BLANC)
    elif oeil == "grand":
        d.ellipse((7, 14 + y, 13, 20 + y), fill=BLANC)
        d.ellipse((9, 16 + y, 11, 18 + y), fill=NOIR)
    else:
        d.ellipse((8, 15 + y, 12, 19 + y), fill=BLANC)
        d.point((10, 17 + y), fill=NOIR)

    # Bouche : une entaille blanche le long du museau
    if bouche == "sourire":
        d.line((2, 22 + y, 7, 23 + y), fill=BLANC)
        d.line((7, 23 + y, 10, 21 + y), fill=BLANC)
    elif bouche == "moue":
        d.line((2, 21 + y, 7, 21 + y), fill=BLANC)
        d.line((7, 21 + y, 10, 23 + y), fill=BLANC)
    else:
        d.line((2, 21 + y, 10, 22 + y), fill=BLANC)


def bulle_pensee(d: ImageDraw.ImageDraw, etape: int) -> None:
    """Trois points qui s'allument l'un apres l'autre, au-dessus de la tete."""
    for i in range(3):
        x = 2 + i * 6
        rayon = 2 if i <= etape else 1
        forme = (x - rayon, 2 - rayon, x + rayon, 2 + rayon)
        if i <= etape:
            d.ellipse(forme, fill=NOIR)
        else:
            d.ellipse(forme, outline=NOIR)


def ondes(d: ImageDraw.ImageDraw, etape: int) -> None:
    """Arcs concentriques devant le museau : il ecoute."""
    for i in range(3):
        if i > etape:
            continue
        rayon = 4 + i * 4
        d.arc((-rayon, 17 - rayon, rayon, 17 + rayon), start=250, end=110, fill=NOIR)


def zzz(d: ImageDraw.ImageDraw, etape: int) -> None:
    """Des Z qui montent."""
    positions = [(22, 6), (26, 2), (30, 0)]
    for i, (x, y) in enumerate(positions):
        if i > etape:
            continue
        taille = 3 + i
        d.line((x, y, x + taille, y), fill=NOIR)
        d.line((x + taille, y, x, y + taille), fill=NOIR)
        d.line((x, y + taille, x + taille, y + taille), fill=NOIR)


def point_exclamation(d: ImageDraw.ImageDraw, plein: bool) -> None:
    if not plein:
        return
    d.rectangle((3, 0, 5, 6), fill=NOIR)
    d.rectangle((3, 8, 5, 9), fill=NOIR)


def goutte(d: ImageDraw.ImageDraw, etape: int) -> None:
    """Une goutte de sueur : il n'est pas rassure."""
    y = 6 + etape * 3
    d.ellipse((24, y, 28, y + 5), fill=NOIR)
    d.polygon([(26, y - 3), (24, y + 2), (28, y + 2)], fill=NOIR)


# --------------------------------------------------------------------------
# Une fonction par humeur : renvoie la liste des images
# --------------------------------------------------------------------------


def humeur_repos() -> list[Image.Image]:
    images = []
    for i, (dy, queue, oeil) in enumerate(
        [(0, 0, "ouvert"), (1, 2, "ouvert"), (1, 0, "ferme"), (0, -2, "ouvert")]
    ):
        image, d = nouvelle_image()
        dessiner_dauphin(d, dy=dy, queue=queue, oeil=oeil)
        images.append(image)
    return images


def humeur_ecoute() -> list[Image.Image]:
    images = []
    for etape in range(4):
        image, d = nouvelle_image()
        dessiner_dauphin(d, dy=0, queue=(1 if etape % 2 else -1), oeil="grand")
        ondes(d, etape if etape < 3 else 2)
        images.append(image)
    return images


def humeur_reflechit() -> list[Image.Image]:
    images = []
    for etape in range(4):
        image, d = nouvelle_image()
        dessiner_dauphin(d, dy=1, queue=0, oeil="ferme" if etape == 3 else "ouvert")
        bulle_pensee(d, etape if etape < 3 else 2)
        images.append(image)
    return images


def humeur_content() -> list[Image.Image]:
    images = []
    for dy, queue in [(2, 0), (0, 3), (-2, 0), (0, -3)]:
        image, d = nouvelle_image()
        dessiner_dauphin(d, dy=dy, queue=queue, oeil="ouvert", bouche="sourire")
        images.append(image)
    return images


def humeur_surpris() -> list[Image.Image]:
    images = []
    for plein in (True, False):
        image, d = nouvelle_image()
        dessiner_dauphin(d, dy=-1, queue=0, oeil="grand", bouche="neutre")
        point_exclamation(d, plein)
        images.append(image)
    return images


def humeur_inquiet() -> list[Image.Image]:
    images = []
    for etape in range(3):
        image, d = nouvelle_image()
        dessiner_dauphin(d, dy=1, queue=0, oeil="ouvert", bouche="moue")
        goutte(d, etape)
        images.append(image)
    return images


def humeur_dort() -> list[Image.Image]:
    images = []
    for etape in range(4):
        image, d = nouvelle_image()
        respire = int(math.sin(etape / 4 * math.tau) * 1.5)
        dessiner_dauphin(d, dy=2 + respire, queue=0, oeil="ferme")
        zzz(d, etape if etape < 3 else 2)
        images.append(image)
    return images


HUMEURS = {
    "repos": (humeur_repos, 4),
    "ecoute": (humeur_ecoute, 6),
    "reflechit": (humeur_reflechit, 5),
    "content": (humeur_content, 8),
    "surpris": (humeur_surpris, 3),
    "inquiet": (humeur_inquiet, 3),
    "dort": (humeur_dort, 3),
}


def generer_icone_app(sortie: Path) -> None:
    """La petite icone 10x10 du menu des applications."""
    image = Image.new("L", (10, 10), BLANC)
    d = ImageDraw.Draw(image)
    d.ellipse((1, 3, 7, 7), fill=NOIR)
    d.polygon([(0, 5), (3, 3), (3, 7)], fill=NOIR)
    d.polygon([(4, 3), (5, 0), (6, 3)], fill=NOIR)
    d.polygon([(6, 3), (9, 1), (9, 9), (6, 7)], fill=NOIR)
    image.convert("1").save(sortie / "icone_10px.png")


def main() -> None:
    parseur = argparse.ArgumentParser(description=__doc__)
    parseur.add_argument(
        "--sortie",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "fap" / "images",
        help="dossier images/ du FAP",
    )
    args = parseur.parse_args()
    args.sortie.mkdir(parents=True, exist_ok=True)

    for nom, (fabrique, cadence) in HUMEURS.items():
        dossier = args.sortie / f"dauphin_{nom}"
        dossier.mkdir(parents=True, exist_ok=True)

        # On nettoie les anciennes images, sinon elles restent dans l'animation.
        for vieux in dossier.glob("frame_*.png"):
            vieux.unlink()

        images = fabrique()
        for i, image in enumerate(images):
            image.convert("1").save(dossier / f"frame_{i:02d}.png")
        (dossier / "frame_rate").write_text(f"{cadence}\n", encoding="utf-8")

        print(f"{nom:10s} {len(images)} images a {cadence} img/s -> {dossier}")

    generer_icone_app(args.sortie)
    print(f"{'icone':10s} 10x10 -> {args.sortie / 'icone_10px.png'}")


if __name__ == "__main__":
    main()
