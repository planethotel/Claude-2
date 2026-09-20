/**
 * @file inventaire.h
 * @brief Recensement de ce que le Flipper a deja capture.
 *
 * On parcourt les dossiers standards (/ext/subghz, /ext/nfc, ...) et on lit
 * l'en-tete Flipper Format de chaque fichier pour en extraire le protocole,
 * la frequence, l'UID... Ce resume est ce que le cerveau recoit : aucun
 * contenu binaire ne quitte l'appareil, seulement des metadonnees.
 */
#pragma once

#include <furi.h>
#include <storage/storage.h>

/** Plafond global, pour borner la RAM et la taille de la trame. */
#define INVENTAIRE_MAX 40
/** Plafond par categorie : on garde les plus recents ouverts en premier. */
#define INVENTAIRE_MAX_PAR_CATEGORIE 10

typedef struct {
    char categorie[10]; /**< subghz, nfc, lfrfid, infrared, badusb, ibutton */
    char nom[40]; /**< nom de fichier */
    char proto[28]; /**< Protocol / Device type / Key type */
    char detail[40]; /**< UID, Data, ou Preset */
    uint32_t frequence; /**< Hz, 0 si sans objet */
} InventaireObjet;

typedef struct {
    InventaireObjet objets[INVENTAIRE_MAX];
    size_t nb;
    Storage* storage;
} Inventaire;

Inventaire* inventaire_alloc(Storage* storage);
void inventaire_free(Inventaire* inventaire);

/**
 * @brief Relit tous les dossiers. Bloquant (quelques centaines de ms).
 * @return nombre d'objets recenses
 */
size_t inventaire_scanner(Inventaire* inventaire);

/** @brief Compte les objets d'une categorie. */
size_t inventaire_compter(const Inventaire* inventaire, const char* categorie);
