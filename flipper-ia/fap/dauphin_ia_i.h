/**
 * @file dauphin_ia_i.h
 * @brief Etat global de l'application et definitions partagees.
 */
#pragma once

#include <furi.h>
#include <furi_hal.h>
#include <gui/gui.h>
#include <gui/view_dispatcher.h>
#include <gui/scene_manager.h>
#include <gui/modules/submenu.h>
#include <gui/modules/widget.h>
#include <gui/modules/text_input.h>
#include <gui/modules/dialog_ex.h>
#include <notification/notification_messages.h>
#include <storage/storage.h>
#include <loader/loader.h>

#include "lien/lien.h"
#include "lien/protocole.h"
#include "contexte/inventaire.h"
#include "views/vue_mascotte.h"
#include "scenes/scenes.h"

#define DAUPHIN_VERSION       "0.1"
#define DAUPHIN_DOSSIER       EXT_PATH("apps_data/dauphin_ia")
#define DAUPHIN_DOSSIER_NOTES DAUPHIN_DOSSIER "/notes"
#define DAUPHIN_FICHIER_CONF  DAUPHIN_DOSSIER "/reglages.txt"

/** Nombre maximum de propositions gardees en memoire. */
#define DAUPHIN_PROPOSITIONS_MAX 8
/** Taille du tampon de saisie libre. */
#define DAUPHIN_SAISIE_MAX 120
/** Delai maximum d'attente d'une reponse du cerveau avant abandon (ms).
 * Sans ca, une question sans reponse (cerveau eteint, reseau coupe, bug cote
 * cerveau) laisse la mascotte sur "Je reflechis..." pour toujours. */
#define DAUPHIN_ATTENTE_MAX_MS 30000

typedef struct DauphinIa DauphinIa;

typedef enum {
    VueMascotteId,
    VueSubmenuId,
    VueWidgetId,
    VueTextInputId,
    VueDialogId,
} DauphinVueId;

/** Evenements internes remontes au gestionnaire de scenes. */
typedef enum {
    /** Une trame est disponible dans la file du lien. */
    DauphinEvtTrame = 0x100,
    /** L'etat du lien a change (connecte / perdu). */
    DauphinEvtLienEtat,
    /** Le cerveau a envoye une liste de propositions complete. */
    DauphinEvtPropositions,
    /** Le cerveau demande l'affichage d'une fiche. */
    DauphinEvtFiche,
    /** Le cerveau a parle. */
    DauphinEvtDire,
    /** Le cerveau demande l'execution d'une proposition. */
    DauphinEvtExec,
    /** Le cerveau signale une erreur. */
    DauphinEvtErreur,
    /** L'utilisateur veut poser une question. */
    DauphinEvtDemander,
    /** L'utilisateur ouvre le menu. */
    DauphinEvtMenu,
    /** L'utilisateur valide une proposition dans la liste. */
    DauphinEvtChoix,
    /** Confirmation accordee dans la scene de confirmation. */
    DauphinEvtConfirme,
    /** Confirmation refusee. */
    DauphinEvtRefuse,
} DauphinEvt;

/** Une proposition recue du cerveau. */
typedef struct {
    char id[12];
    char titre[40];
    char detail[192];
    ProtoRisque risque;
    ProtoActe acte;
    char app[24];
    char arg[96];
    char chemin[96];
    char contenu[192];
} DauphinProposition;

struct DauphinIa {
    Gui* gui;
    Storage* storage;
    NotificationApp* notifications;
    Loader* loader;

    ViewDispatcher* view_dispatcher;
    SceneManager* scene_manager;

    Submenu* submenu;
    Widget* widget;
    TextInput* text_input;
    DialogEx* dialog_ex;
    VueMascotte* mascotte;

    Lien* lien;
    Inventaire* inventaire;

    DauphinProposition propositions[DAUPHIN_PROPOSITIONS_MAX];
    size_t propositions_nb;
    /** Nombre annonce par la trame PROPOSITIONS (pour savoir quand la liste est complete). */
    size_t propositions_attendues;
    size_t proposition_choisie;

    char saisie[DAUPHIN_SAISIE_MAX];
    FuriString* fiche_titre;
    FuriString* fiche_corps;
    FuriString* derniere_erreur;

    /** Horodatage du dernier POULS envoye. */
    uint32_t dernier_pouls;
    /** Le tout premier appel a dauphin_pouls() n'a pas encore eu lieu.
     * Sert a montrer l'astuce "mode seul" une fois, si le cerveau ne
     * repond toujours pas au bout de ce premier delai. */
    bool premier_pouls_a_faire;

    /** Une question ou un inventaire attend une reponse du cerveau. */
    bool en_attente_reponse;
    /** Horodatage de l'envoi qui attend sa reponse. */
    uint32_t attente_depuis;

    /** Tampon de decodage reutilise (trop gros pour la pile). */
    ProtoTrame trame;
};

/** Traite une trame recue du cerveau. Appele sur le fil de la GUI. */
void dauphin_traiter_trame(DauphinIa* app, const ProtoTrame* trame);

/**
 * @brief Signale qu'une reponse du cerveau est attendue a partir de maintenant.
 * A appeler juste apres avoir envoye une question ou un inventaire.
 */
void dauphin_armer_attente(DauphinIa* app);

/**
 * @brief A appeler a chaque tick (pas besoin d'attendre le pouls des 10 s).
 * Abandonne et previent l'utilisateur si DAUPHIN_ATTENTE_MAX_MS est depasse.
 */
void dauphin_verifier_attente(DauphinIa* app);

/** Envoie l'inventaire courant au cerveau (re-scan complet). */
void dauphin_envoyer_inventaire(DauphinIa* app);

/** Envoie un battement de coeur si le delai est ecoule. */
void dauphin_pouls(DauphinIa* app);

/** Execute la proposition d'indice donne. Renvoie true si l'action a abouti. */
bool dauphin_executer(DauphinIa* app, size_t indice);
