#include "executeur.h"
#include "../dauphin_ia_i.h"

#include <storage/storage.h>
#include <loader/loader.h>

#define TAG "DauphinExec"

/** Ecrit une note dans /ext/apps_data/dauphin_ia/notes/. */
static bool executeur_note(DauphinIa* app, const DauphinProposition* prop, FuriString* rendu) {
    if(prop->chemin[0] == '\0') {
        furi_string_set_str(rendu, "chemin manquant");
        return false;
    }

    /* On refuse tout chemin qui sortirait du dossier de notes. */
    if(strchr(prop->chemin, '/') || strstr(prop->chemin, "..")) {
        furi_string_set_str(rendu, "nom de note invalide");
        return false;
    }

    storage_common_mkdir(app->storage, DAUPHIN_DOSSIER);
    storage_common_mkdir(app->storage, DAUPHIN_DOSSIER_NOTES);

    FuriString* chemin = furi_string_alloc_printf("%s/%s", DAUPHIN_DOSSIER_NOTES, prop->chemin);
    File* fichier = storage_file_alloc(app->storage);
    bool ok = false;

    if(storage_file_open(
           fichier, furi_string_get_cstr(chemin), FSAM_WRITE, FSOM_CREATE_ALWAYS)) {
        size_t taille = strlen(prop->contenu);
        ok = storage_file_write(fichier, prop->contenu, taille) == taille;
    }

    storage_file_close(fichier);
    storage_file_free(fichier);

    if(ok) {
        furi_string_printf(rendu, "note ecrite: %s", prop->chemin);
    } else {
        furi_string_set_str(rendu, "ecriture impossible");
    }
    furi_string_free(chemin);
    return ok;
}

static bool executeur_notifier(DauphinIa* app, const DauphinProposition* prop, FuriString* rendu) {
    const NotificationSequence* sequence = &sequence_blink_blue_10;

    if(strcmp(prop->arg, "succes") == 0) {
        sequence = &sequence_success;
    } else if(strcmp(prop->arg, "erreur") == 0) {
        sequence = &sequence_error;
    } else if(strcmp(prop->arg, "vibre") == 0) {
        sequence = &sequence_single_vibro;
    } else if(strcmp(prop->arg, "alerte") == 0) {
        sequence = &sequence_audiovisual_alert;
    }

    notification_message(app->notifications, sequence);
    furi_string_set_str(rendu, "notification jouee");
    return true;
}

/**
 * Le loader refuse de demarrer une application tant que la notre tourne. On
 * passe donc par la file de lancement differe de Momentum : l'application
 * demandee s'ouvrira des que nous aurons rendu la main.
 */
static bool
    executeur_ouvrir_app(DauphinIa* app, const DauphinProposition* prop, FuriString* rendu) {
    if(prop->app[0] == '\0') {
        furi_string_set_str(rendu, "application manquante");
        return false;
    }

    loader_enqueue_launch(
        app->loader, prop->app, prop->arg[0] ? prop->arg : NULL, LoaderDeferredLaunchFlagGui);

    furi_string_printf(rendu, "ouverture de %s a la fermeture", prop->app);

    /* On rend la main : le lancement differe prend le relais. */
    view_dispatcher_stop(app->view_dispatcher);
    return true;
}

bool executeur_lancer(DauphinIa* app, size_t indice, FuriString* rendu) {
    furi_assert(app);
    furi_assert(rendu);

    if(indice >= app->propositions_nb) {
        furi_string_set_str(rendu, "proposition inconnue");
        return false;
    }

    const DauphinProposition* prop = &app->propositions[indice];
    FURI_LOG_I(TAG, "execution %s (acte %d)", prop->id, (int)prop->acte);

    switch(prop->acte) {
    case ProtoActeOuvrirApp:
        return executeur_ouvrir_app(app, prop, rendu);
    case ProtoActeNote:
        return executeur_note(app, prop, rendu);
    case ProtoActeNotifier:
        return executeur_notifier(app, prop, rendu);
    case ProtoActeInventaire:
        dauphin_envoyer_inventaire(app);
        furi_string_set_str(rendu, "inventaire renvoye");
        return true;
    case ProtoActeFiche:
    case ProtoActeRien:
    default:
        furi_string_set_str(rendu, "fiche affichee");
        return true;
    }
}
