/**
 * @file vue_mascotte.h
 * @brief L'ecran d'accueil : le dauphin vivant, sa bulle, sa barre d'etat.
 */
#pragma once

#include <gui/view.h>

typedef enum {
    HumeurRepos = 0,
    HumeurEcoute,
    HumeurReflechit,
    HumeurContent,
    HumeurSurpris,
    HumeurInquiet,
    HumeurDort,
    HumeurNb,
} Humeur;

/** Evenements remontes par la vue au gestionnaire de scenes. */
typedef enum {
    VueMascotteEvtMenu, /**< appui OK */
    VueMascotteEvtDemander, /**< appui droite : poser une question */
    VueMascotteEvtPropositions, /**< appui gauche : revoir les propositions */
    VueMascotteEvtReveil, /**< appui haut : relancer une analyse */
} VueMascotteEvt;

typedef struct VueMascotte VueMascotte;
typedef void (*VueMascotteRappel)(VueMascotteEvt evenement, void* contexte);

VueMascotte* vue_mascotte_alloc(void);
void vue_mascotte_free(VueMascotte* vue);
View* vue_mascotte_get_view(VueMascotte* vue);

void vue_mascotte_set_rappel(VueMascotte* vue, VueMascotteRappel rappel, void* contexte);

/** @brief Change l'animation courante. */
void vue_mascotte_set_humeur(VueMascotte* vue, Humeur humeur);
Humeur vue_mascotte_get_humeur(const VueMascotte* vue);

/** @brief Traduit le nom textuel d'une humeur (protocole) en enum. */
Humeur vue_mascotte_humeur_depuis_texte(const char* texte);

/** @brief Remplace le texte de la bulle (ASCII, decoupe automatiquement). */
void vue_mascotte_dire(VueMascotte* vue, const char* texte);

/** @brief Met a jour la ligne d'etat du bas. */
void vue_mascotte_set_etat(VueMascotte* vue, const char* etat, uint8_t batterie);

/** @brief Affiche ou cache la pastille « propositions en attente ». */
void vue_mascotte_set_propositions(VueMascotte* vue, size_t nb);
