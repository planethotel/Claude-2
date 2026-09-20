/**
 * @file savoir.h
 * @brief Petit dictionnaire de protocoles, embarque dans le firmware.
 *
 * C'est la version « sans cerveau » du connaisseur Python
 * (cerveau/dauphin/connaisseur.py + les fiches JSON du dossier savoir/) :
 * les memes fiches,
 * recopiees ici en dur pour que le Flipper puisse identifier une capture
 * meme quand aucun ordinateur n'est branche. Moins riche que le cerveau
 * (pas de conversation, pas de proposition generee), mais toujours
 * disponible.
 *
 * Garder les deux bases synchronisees a la main : elles sont petites et
 * changent rarement.
 */
#pragma once

#include <furi.h>

/** Une fiche d'identification pour un protocole. */
typedef struct {
    const char* categorie; /**< subghz, nfc, lfrfid, infrared */
    const char* proto; /**< prefixe : "Mifare Classic" reconnait "Mifare Classic 1K" */
    const char* resume; /**< une ou deux phrases, ASCII, pour l'ecran */
} SavoirFiche;

/**
 * @brief Cherche la fiche la plus proche pour un objet capture.
 *
 * Correspondance par prefixe, comme cote Python : "Mifare Classic 1K"
 * retrouve la fiche "Mifare Classic".
 *
 * @return la fiche, ou NULL si le protocole est inconnu
 */
const SavoirFiche* savoir_chercher(const char* categorie, const char* proto);

/** @brief Nom lisible d'une categorie (subghz -> "radio sous 1 GHz"). */
const char* savoir_nom_categorie(const char* categorie);
