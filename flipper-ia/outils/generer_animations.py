#!/usr/bin/env python3
"""Genere les animations de la mascotte pour le FAP -- un crane anime.

Chaque humeur devient un dossier `fap/images/dauphin_<humeur>/` contenant les
images `frame_XX.png` et un fichier `frame_rate`. Le compilateur d'assets du
firmware en fait une icone animee nommee `A_dauphin_<humeur>`. Les noms de
dossiers/symboles restent "dauphin_*" pour ne rien casser cote FAP (vue_mascotte.c
les reference telles quelles) -- seul le dessin a change.

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


def dessiner_crane(
    d: ImageDraw.ImageDraw,
    dy: int = 0,
    inclinaison: int = 0,
    machoire: int = 0,
    oeil: str = "ouvert",
) -> None:
    """Crane de face, style pixel-art classique (silhouette blanche, trait noir).

    dy            decalage vertical (respiration, sursaut)
    inclinaison   decalage horizontal du bas du crane (tete penchee)
    machoire      ecartement de la machoire (0 = fermee, >0 = bouche ouverte)
    oeil          ouvert | ferme | grand | tombant
    """
    y = dy
    p = inclinaison

    # Contour exterieur : calotte + machoire, en noir plein.
    d.ellipse((3, 2 + y, 31, 20 + y), fill=NOIR)
    d.polygon(
        [
            (9 + p, 15 + y),
            (25 + p, 15 + y),
            (23 + p, 29 + y + machoire),
            (11 + p, 29 + y + machoire),
        ],
        fill=NOIR,
    )

    # Interieur blanc, legerement plus petit : ca cree le trait noir du contour.
    d.ellipse((5, 4 + y, 29, 17 + y), fill=BLANC)
    d.polygon(
        [
            (11 + p, 17 + y),
            (23 + p, 17 + y),
            (21 + p, 26 + y + machoire),
            (13 + p, 26 + y + machoire),
        ],
        fill=BLANC,
    )

    # Orbites
    if oeil == "ferme":
        d.line((9, 10 + y, 14, 10 + y), fill=NOIR, width=2)
        d.line((20, 10 + y, 25, 10 + y), fill=NOIR, width=2)
    elif oeil == "grand":
        d.ellipse((7, 7 + y, 15, 15 + y), fill=NOIR)
        d.ellipse((19, 7 + y, 27, 15 + y), fill=NOIR)
    elif oeil == "tombant":
        d.ellipse((7, 8 + y, 14, 14 + y), fill=NOIR)
        d.ellipse((20, 9 + y, 27, 16 + y), fill=NOIR)
    else:
        d.ellipse((8, 8 + y, 14, 14 + y), fill=NOIR)
        d.ellipse((20, 8 + y, 26, 14 + y), fill=NOIR)

    # Cavite nasale
    d.polygon([(17, 14 + y), (15, 18 + y), (19, 18 + y)], fill=NOIR)

    # Dents : traits verticaux le long du bas de la machoire.
    bas_machoire = 25 + y + machoire
    haut_dents = 19 + y
    for tx in range(13, 22, 3):
        d.line((tx + p, haut_dents, tx + p, bas_machoire), fill=NOIR)
    d.line((11 + p, haut_dents, 23 + p, haut_dents), fill=NOIR)


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
    """Arcs concentriques a droite du crane : il ecoute."""
    cx = 34
    for i in range(3):
        if i > etape:
            continue
        rayon = 4 + i * 4
        d.arc((cx - rayon, 11 - rayon, cx + rayon, 11 + rayon), start=110, end=250, fill=NOIR)


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
    d.rectangle((0, 3, 2, 9), fill=NOIR)
    d.rectangle((0, 11, 2, 12), fill=NOIR)


def goutte(d: ImageDraw.ImageDraw, etape: int) -> None:
    """Une goutte de sueur sur la tempe : il n'est pas rassure."""
    y = 3 + etape * 3
    d.ellipse((28, y, 32, y + 5), fill=NOIR)
    d.polygon([(30, y - 3), (28, y + 2), (32, y + 2)], fill=NOIR)


# --------------------------------------------------------------------------
# Une fonction par humeur : renvoie la liste des images
# --------------------------------------------------------------------------


def humeur_repos() -> list[Image.Image]:
    images = []
    for dy, oeil in [(0, "ouvert"), (1, "ouvert"), (1, "ferme"), (0, "ouvert")]:
        image, d = nouvelle_image()
        dessiner_crane(d, dy=dy, oeil=oeil)
        images.append(image)
    return images


def humeur_ecoute() -> list[Image.Image]:
    images = []
    for etape in range(4):
        image, d = nouvelle_image()
        dessiner_crane(d, dy=0, inclinaison=(1 if etape % 2 else -1), oeil="grand")
        ondes(d, etape if etape < 3 else 2)
        images.append(image)
    return images


def humeur_reflechit() -> list[Image.Image]:
    images = []
    for etape in range(4):
        image, d = nouvelle_image()
        dessiner_crane(d, dy=1, inclinaison=1, oeil="ferme" if etape == 3 else "ouvert")
        bulle_pensee(d, etape if etape < 3 else 2)
        images.append(image)
    return images


def humeur_content() -> list[Image.Image]:
    images = []
    for dy, machoire in [(2, 3), (0, 5), (-1, 3), (0, 5)]:
        image, d = nouvelle_image()
        dessiner_crane(d, dy=dy, machoire=machoire, oeil="grand")
        images.append(image)
    return images


def humeur_surpris() -> list[Image.Image]:
    images = []
    for plein, machoire in ((True, 6), (False, 1)):
        image, d = nouvelle_image()
        dessiner_crane(d, dy=-1, machoire=machoire, oeil="grand")
        point_exclamation(d, plein)
        images.append(image)
    return images


def humeur_inquiet() -> list[Image.Image]:
    images = []
    for etape in range(3):
        image, d = nouvelle_image()
        dessiner_crane(d, dy=1, inclinaison=-1, machoire=1, oeil="tombant")
        goutte(d, etape)
        images.append(image)
    return images


def humeur_dort() -> list[Image.Image]:
    images = []
    for etape in range(4):
        image, d = nouvelle_image()
        respire = int(math.sin(etape / 4 * math.tau) * 1.5)
        dessiner_crane(d, dy=2 + respire, machoire=1, oeil="ferme")
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
    """La petite icone 10x10 du menu des applications : un crane miniature."""
    image = Image.new("L", (10, 10), BLANC)
    d = ImageDraw.Draw(image)
    d.ellipse((0, 0, 9, 6), fill=NOIR)
    d.ellipse((1, 1, 8, 5), fill=BLANC)
    d.point((3, 3), fill=NOIR)
    d.point((6, 3), fill=NOIR)
    d.rectangle((3, 6, 6, 8), fill=NOIR)
    d.rectangle((4, 6, 5, 8), fill=BLANC)
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
