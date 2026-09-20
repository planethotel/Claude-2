/**
 * @file dauphin_ia.c
 * @brief Point d'entree, cycle de vie, et traitement des trames du cerveau.
 */
#include "dauphin_ia_i.h"
#include "actions/executeur.h"

#include <furi_hal_version.h>
#include <string.h>

#define TAG "DauphinIa"

/** Periode du tick des scenes, en millisecondes. */
#define DAUPHIN_TICK_MS 500
/** Intervalle entre deux battements de coeur, en millisecondes. */
#define DAUPHIN_POULS_MS 10000

/* ------------------------------------------------------------------ */
/* Envoi                                                              */
/* ------------------------------------------------------------------ */

static void dauphin_envoyer(DauphinIa* app, FuriString* ligne) {
    lien_envoyer(app->lien, ligne);
    furi_string_free(ligne);
}

static void dauphin_saluer(DauphinIa* app) {
    char version[8];
    snprintf(version, sizeof(version), "%d", PROTO_VERSION);

    FuriString* ligne = proto_construire(
        "BONJOUR",
        "v",
        version,
        "app",
        DAUPHIN_VERSION,
        "nom",
        furi_hal_version_get_name_ptr() ? furi_hal_version_get_name_ptr() : "Flipper",
        NULL);
    dauphin_envoyer(app, ligne);
}

void dauphin_envoyer_inventaire(DauphinIa* app) {
    furi_assert(app);

    vue_mascotte_set_humeur(app->mascotte, HumeurReflechit);
    vue_mascotte_dire(app->mascotte, "Je fais le tour de mes captures...");

    size_t nb = inventaire_scanner(app->inventaire);

    /* nb est en realite borne par INVENTAIRE_MAX, mais son type (size_t) ne le
     * prouve pas au compilateur : le tampon est dimensionne pour un "unsigned"
     * quelconque (10 chiffres + le caractere nul). */
    char compte[12];
    snprintf(compte, sizeof(compte), "%u", (unsigned)nb);
    dauphin_envoyer(app, proto_construire("INVENTAIRE", "n", compte, NULL));

    for(size_t i = 0; i < nb; i++) {
        const InventaireObjet* objet = &app->inventaire->objets[i];

        FuriString* ligne = furi_string_alloc_set_str("OBJET");
        proto_ajouter(ligne, "cat", objet->categorie);
        proto_ajouter(ligne, "nom", objet->nom);
        if(objet->proto[0]) proto_ajouter(ligne, "proto", objet->proto);
        if(objet->detail[0]) proto_ajouter(ligne, "detail", objet->detail);
        if(objet->frequence) proto_ajouter_u32(ligne, "freq", objet->frequence);
        furi_string_push_back(ligne, '\n');

        dauphin_envoyer(app, ligne);
    }

    vue_mascotte_dire(app->mascotte, "Envoye. Je laisse le cerveau digerer.");
}

void dauphin_pouls(DauphinIa* app) {
    furi_assert(app);

    uint32_t maintenant = furi_get_tick();
    if(maintenant - app->dernier_pouls < furi_ms_to_ticks(DAUPHIN_POULS_MS)) return;
    app->dernier_pouls = maintenant;

    /* Ce POULS passe la barriere de temps ci-dessus : c'est un vrai
     * declenchement (le tout premier survient ~10 s apres le demarrage, pas
     * avant). On s'en sert seulement pour l'astuce ci-dessous. */
    bool premier_pouls = app->premier_pouls_a_faire;
    app->premier_pouls_a_faire = false;

    uint8_t batterie = furi_hal_power_get_pct();

    LienEtat etat_lien = lien_get_etat(app->lien);
    const char* etat = "hors ligne";
    switch(etat_lien) {
    case LienEtatOuvert:
        etat = "en attente";
        break;
    case LienEtatRelie:
        etat = "relie";
        break;
    default:
        break;
    }
    vue_mascotte_set_etat(app->mascotte, etat, batterie);

    /* Toujours pas de cerveau au bout du premier pouls (~10 s) : on montre
     * une fois le menu qui marche sans lui. */
    if(premier_pouls && etat_lien != LienEtatRelie) {
        vue_mascotte_dire(
            app->mascotte,
            "Pas de cerveau branche. Menu -> Identifier seul, ou branche l'ordinateur.");
    }

    char texte[8];
    snprintf(texte, sizeof(texte), "%u", (unsigned)batterie);
    dauphin_envoyer(
        app,
        proto_construire(
            "POULS", "batt", texte, "charge", furi_hal_power_is_charging() ? "1" : "0", NULL));
}

bool dauphin_executer(DauphinIa* app, size_t indice) {
    furi_assert(app);

    FuriString* rendu = furi_string_alloc();
    bool ok = executeur_lancer(app, indice, rendu);

    const DauphinProposition* prop = &app->propositions[indice];
    FuriString* ligne = proto_construire(
        "RESULTAT",
        "id",
        prop->id,
        "ok",
        ok ? "1" : "0",
        "detail",
        furi_string_get_cstr(rendu),
        NULL);
    dauphin_envoyer(app, ligne);

    if(ok) {
        vue_mascotte_dire(app->mascotte, furi_string_get_cstr(rendu));
    } else {
        vue_mascotte_set_humeur(app->mascotte, HumeurInquiet);
        vue_mascotte_dire(app->mascotte, furi_string_get_cstr(rendu));
    }

    furi_string_free(rendu);
    return ok;
}

/* ------------------------------------------------------------------ */
/* Reception                                                          */
/* ------------------------------------------------------------------ */

static void dauphin_recevoir_proposition(DauphinIa* app, const ProtoTrame* trame) {
    if(app->propositions_nb >= DAUPHIN_PROPOSITIONS_MAX) return;

    DauphinProposition* prop = &app->propositions[app->propositions_nb];
    memset(prop, 0, sizeof(DauphinProposition));

    strlcpy(prop->id, proto_champ(trame, "id", "?"), sizeof(prop->id));
    strlcpy(prop->titre, proto_champ(trame, "titre", "(sans titre)"), sizeof(prop->titre));
    strlcpy(prop->detail, proto_champ(trame, "detail", ""), sizeof(prop->detail));
    strlcpy(prop->app, proto_champ(trame, "app", ""), sizeof(prop->app));
    strlcpy(prop->arg, proto_champ(trame, "arg", ""), sizeof(prop->arg));
    strlcpy(prop->chemin, proto_champ(trame, "chemin", ""), sizeof(prop->chemin));
    strlcpy(prop->contenu, proto_champ(trame, "contenu", ""), sizeof(prop->contenu));
    prop->risque = proto_risque(proto_champ(trame, "risque", "sur"));
    prop->acte = proto_acte(proto_champ(trame, "act", "rien"));

    app->propositions_nb++;
    vue_mascotte_set_propositions(app->mascotte, app->propositions_nb);
}

void dauphin_traiter_trame(DauphinIa* app, const ProtoTrame* trame) {
    furi_assert(app);
    furi_assert(trame);

    switch(trame->type) {
    case ProtoTypeHumeur:
        vue_mascotte_set_humeur(
            app->mascotte, vue_mascotte_humeur_depuis_texte(proto_champ(trame, "etat", "repos")));
        break;

    case ProtoTypeDire: {
        const char* humeur = proto_champ(trame, "humeur", NULL);
        if(humeur) {
            vue_mascotte_set_humeur(app->mascotte, vue_mascotte_humeur_depuis_texte(humeur));
        }
        vue_mascotte_dire(app->mascotte, proto_champ(trame, "texte", ""));
        break;
    }

    case ProtoTypePropositions:
        /* Nouvelle serie : on oublie la precedente. */
        app->propositions_nb = 0;
        app->propositions_attendues = proto_champ_u32(trame, "n", 0);
        vue_mascotte_set_propositions(app->mascotte, 0);
        break;

    case ProtoTypeProposition:
        dauphin_recevoir_proposition(app, trame);
        if(app->propositions_nb >= app->propositions_attendues &&
           app->propositions_attendues > 0) {
            notification_message(app->notifications, &sequence_blink_blue_10);
        }
        break;

    case ProtoTypeFiche:
        furi_string_set_str(app->fiche_titre, proto_champ(trame, "titre", "Fiche"));
        furi_string_set_str(app->fiche_corps, proto_champ(trame, "corps", ""));
        scene_manager_next_scene(app->scene_manager, DauphinSceneFiche);
        break;

    case ProtoTypeExec: {
        /* Le cerveau demande une execution : on la traite comme un choix. */
        const char* id = proto_champ(trame, "id", "");
        for(size_t i = 0; i < app->propositions_nb; i++) {
            if(strcmp(app->propositions[i].id, id) != 0) continue;

            app->proposition_choisie = i;
            if(app->propositions[i].risque == ProtoRisqueEmission) {
                /* Jamais sans l'accord de la personne devant l'appareil. */
                scene_manager_next_scene(app->scene_manager, DauphinSceneConfirmation);
            } else {
                dauphin_executer(app, i);
            }
            break;
        }
        break;
    }

    case ProtoTypeErreur:
        vue_mascotte_set_humeur(app->mascotte, HumeurInquiet);
        vue_mascotte_dire(app->mascotte, proto_champ(trame, "texte", "Le cerveau a un souci."));
        furi_string_set_str(app->derniere_erreur, proto_champ(trame, "texte", ""));
        break;

    default:
        break;
    }
}

/* ------------------------------------------------------------------ */
/* Plomberie GUI                                                      */
/* ------------------------------------------------------------------ */

/** Appele depuis le fil du lien : on previent la GUI, sans rien traiter ici. */
static void dauphin_lien_rappel(void* contexte) {
    DauphinIa* app = contexte;
    view_dispatcher_send_custom_event(app->view_dispatcher, DauphinEvtTrame);
}

static bool dauphin_evenement_perso(void* contexte, uint32_t evenement) {
    DauphinIa* app = contexte;

    if(evenement == DauphinEvtTrame) {
        while(lien_lire(app->lien, &app->trame)) {
            dauphin_traiter_trame(app, &app->trame);
        }
        return true;
    }

    return scene_manager_handle_custom_event(app->scene_manager, evenement);
}

static bool dauphin_evenement_retour(void* contexte) {
    DauphinIa* app = contexte;
    return scene_manager_handle_back_event(app->scene_manager);
}

static void dauphin_evenement_tick(void* contexte) {
    DauphinIa* app = contexte;
    scene_manager_handle_tick_event(app->scene_manager);
}

/* ------------------------------------------------------------------ */
/* Cycle de vie                                                       */
/* ------------------------------------------------------------------ */

static DauphinIa* dauphin_alloc(void) {
    DauphinIa* app = malloc(sizeof(DauphinIa));
    memset(app, 0, sizeof(DauphinIa));
    app->premier_pouls_a_faire = true;

    app->gui = furi_record_open(RECORD_GUI);
    app->storage = furi_record_open(RECORD_STORAGE);
    app->notifications = furi_record_open(RECORD_NOTIFICATION);
    app->loader = furi_record_open(RECORD_LOADER);

    app->fiche_titre = furi_string_alloc();
    app->fiche_corps = furi_string_alloc();
    app->derniere_erreur = furi_string_alloc();

    app->view_dispatcher = view_dispatcher_alloc();
    app->scene_manager = scene_manager_alloc(&dauphin_scene_handlers, app);

    view_dispatcher_set_event_callback_context(app->view_dispatcher, app);
    view_dispatcher_set_custom_event_callback(app->view_dispatcher, dauphin_evenement_perso);
    view_dispatcher_set_navigation_event_callback(app->view_dispatcher, dauphin_evenement_retour);
    view_dispatcher_set_tick_event_callback(
        app->view_dispatcher, dauphin_evenement_tick, DAUPHIN_TICK_MS);

    app->mascotte = vue_mascotte_alloc();
    app->submenu = submenu_alloc();
    app->widget = widget_alloc();
    app->text_input = text_input_alloc();
    app->dialog_ex = dialog_ex_alloc();

    view_dispatcher_add_view(
        app->view_dispatcher, VueMascotteId, vue_mascotte_get_view(app->mascotte));
    view_dispatcher_add_view(app->view_dispatcher, VueSubmenuId, submenu_get_view(app->submenu));
    view_dispatcher_add_view(app->view_dispatcher, VueWidgetId, widget_get_view(app->widget));
    view_dispatcher_add_view(
        app->view_dispatcher, VueTextInputId, text_input_get_view(app->text_input));
    view_dispatcher_add_view(
        app->view_dispatcher, VueDialogId, dialog_ex_get_view(app->dialog_ex));

    app->inventaire = inventaire_alloc(app->storage);

    app->lien = lien_alloc();
    lien_set_rappel(app->lien, dauphin_lien_rappel, app);

    return app;
}

static void dauphin_free(DauphinIa* app) {
    furi_assert(app);

    lien_free(app->lien);
    inventaire_free(app->inventaire);

    view_dispatcher_remove_view(app->view_dispatcher, VueMascotteId);
    view_dispatcher_remove_view(app->view_dispatcher, VueSubmenuId);
    view_dispatcher_remove_view(app->view_dispatcher, VueWidgetId);
    view_dispatcher_remove_view(app->view_dispatcher, VueTextInputId);
    view_dispatcher_remove_view(app->view_dispatcher, VueDialogId);

    vue_mascotte_free(app->mascotte);
    submenu_free(app->submenu);
    widget_free(app->widget);
    text_input_free(app->text_input);
    dialog_ex_free(app->dialog_ex);

    scene_manager_free(app->scene_manager);
    view_dispatcher_free(app->view_dispatcher);

    furi_string_free(app->fiche_titre);
    furi_string_free(app->fiche_corps);
    furi_string_free(app->derniere_erreur);

    furi_record_close(RECORD_LOADER);
    furi_record_close(RECORD_NOTIFICATION);
    furi_record_close(RECORD_STORAGE);
    furi_record_close(RECORD_GUI);

    free(app);
}

int32_t dauphin_ia_app(void* p) {
    UNUSED(p);

    DauphinIa* app = dauphin_alloc();

    view_dispatcher_attach_to_gui(app->view_dispatcher, app->gui, ViewDispatcherTypeFullscreen);
    scene_manager_next_scene(app->scene_manager, DauphinSceneAccueil);

    lien_demarrer(app->lien);
    dauphin_saluer(app);
    dauphin_envoyer_inventaire(app);

    view_dispatcher_run(app->view_dispatcher);

    dauphin_envoyer(app, proto_construire("AUREVOIR", NULL));
    dauphin_free(app);

    return 0;
}
