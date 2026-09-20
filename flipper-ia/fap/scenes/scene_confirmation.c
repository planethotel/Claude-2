#include "../dauphin_ia_i.h"

/**
 * Garde-fou : toute action qui fait sortir un signal de l'appareil passe par
 * cet ecran. Le cerveau ne peut pas le contourner, c'est le FAP qui decide.
 */

static void dauphin_scene_confirmation_rappel(DialogExResult resultat, void* contexte) {
    DauphinIa* app = contexte;
    view_dispatcher_send_custom_event(
        app->view_dispatcher,
        resultat == DialogExResultRight ? DauphinEvtConfirme : DauphinEvtRefuse);
}

void dauphin_scene_confirmation_on_enter(void* contexte) {
    DauphinIa* app = contexte;
    const DauphinProposition* prop = &app->propositions[app->proposition_choisie];

    static char corps[160];
    if(prop->acte == ProtoActeOuvrirApp) {
        snprintf(
            corps,
            sizeof(corps),
            "%s\nva ouvrir %s\navec %s.\nCela peut emettre.",
            prop->titre,
            prop->app,
            prop->arg[0] ? prop->arg : "(rien)");
    } else {
        snprintf(corps, sizeof(corps), "%s\nCela peut emettre.", prop->titre);
    }

    dialog_ex_reset(app->dialog_ex);
    dialog_ex_set_header(app->dialog_ex, "Emission", 64, 2, AlignCenter, AlignTop);
    dialog_ex_set_text(app->dialog_ex, corps, 64, 16, AlignCenter, AlignTop);
    dialog_ex_set_left_button_text(app->dialog_ex, "Non");
    dialog_ex_set_right_button_text(app->dialog_ex, "J'y vais");
    dialog_ex_set_result_callback(app->dialog_ex, dauphin_scene_confirmation_rappel);
    dialog_ex_set_context(app->dialog_ex, app);

    view_dispatcher_switch_to_view(app->view_dispatcher, VueDialogId);
}

bool dauphin_scene_confirmation_on_event(void* contexte, SceneManagerEvent evenement) {
    DauphinIa* app = contexte;
    if(evenement.type != SceneManagerEventTypeCustom) return false;

    if(evenement.event == DauphinEvtConfirme) {
        dauphin_executer(app, app->proposition_choisie);
        return true;
    }

    if(evenement.event == DauphinEvtRefuse) {
        const DauphinProposition* prop = &app->propositions[app->proposition_choisie];
        FuriString* ligne =
            proto_construire("REFUS", "id", prop->id, "motif", "refus utilisateur", NULL);
        lien_envoyer(app->lien, ligne);
        furi_string_free(ligne);

        scene_manager_previous_scene(app->scene_manager);
        return true;
    }

    return false;
}

void dauphin_scene_confirmation_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    dialog_ex_reset(app->dialog_ex);
}
