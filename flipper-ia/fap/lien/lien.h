/**
 * @file lien.h
 * @brief Canal serie vers le cerveau (USB CDC canal 1, ou UART broches 13/14).
 *
 * Le fil de travail assemble les octets recus en lignes, les empile dans une
 * file, et previent l'appelant par un rappel. Le decodage en trame se fait sur
 * le fil appelant (la GUI), via lien_lire().
 */
#pragma once

#include <furi.h>
#include "protocole.h"

typedef enum {
    LienCanalUsb = 0, /**< USB CDC canal 1 : le shell CLI reste utilisable sur le canal 0 */
    LienCanalUart, /**< USART broches 13 (TX) / 14 (RX) */
} LienCanal;

typedef enum {
    LienEtatFerme = 0,
    LienEtatOuvert, /**< canal ouvert, personne en face pour l'instant */
    LienEtatRelie, /**< le cerveau repond */
} LienEtat;

typedef struct Lien Lien;

/** Rappel appele (hors GUI) quand au moins une ligne est disponible. */
typedef void (*LienRappel)(void* contexte);

#define LIEN_DEBIT_DEFAUT 115200

Lien* lien_alloc(void);
void lien_free(Lien* lien);

/** @brief Choisit le canal. A appeler avant lien_demarrer(). */
void lien_set_canal(Lien* lien, LienCanal canal);
LienCanal lien_get_canal(const Lien* lien);

void lien_set_rappel(Lien* lien, LienRappel rappel, void* contexte);

/** @brief Ouvre le canal et lance le fil de reception. */
void lien_demarrer(Lien* lien);

/** @brief Ferme le canal et arrete le fil. Idempotent. */
void lien_arreter(Lien* lien);

LienEtat lien_get_etat(const Lien* lien);

/** @brief Envoie une ligne deja terminee par \n. La chaine reste a l'appelant. */
void lien_envoyer(Lien* lien, const FuriString* ligne);

/**
 * @brief Depile une trame recue.
 * @return false si la file est vide ou si la ligne est illisible
 */
bool lien_lire(Lien* lien, ProtoTrame* out);

/** @brief Nombre de lignes en attente. */
size_t lien_en_attente(const Lien* lien);
