#include "../dauphin_ia_i.h"

static void dauphin_scene_demande_rappel(void* contexte) {
    DauphinIa* app = contexte;
    view_dispatcher_send_custom_event(app->view_dispatcher, DauphinEvtDemander);
}

void dauphin_scene_demande_on_enter(void* contexte) {
    DauphinIa* app = contexte;

    app->saisie[0] = '\0';
    text_input_reset(app->text_input);
    text_input_set_header_text(app->text_input, "Ta question au dauphin");
    text_input_set_result_callback(
        app->text_input,
        dauphin_scene_demande_rappel,
        app,
        app->saisie,
        sizeof(app->saisie),
        true);

    view_dispatcher_switch_to_view(app->view_dispatcher, VueTextInputId);
}

bool dauphin_scene_demande_on_event(void* contexte, SceneManagerEvent evenement) {
    DauphinIa* app = contexte;
    if(evenement.type != SceneManagerEventTypeCustom) return false;
    if(evenement.event != DauphinEvtDemander) return false;

    if(app->saisie[0] != '\0') {
        FuriString* ligne = proto_construire("DEMANDE", "texte", app->saisie, NULL);
        lien_envoyer(app->lien, ligne);
        furi_string_free(ligne);

        vue_mascotte_set_humeur(app->mascotte, HumeurReflechit);
        if(lien_get_etat(app->lien) == LienEtatRelie) {
            vue_mascotte_dire(app->mascotte, "Je reflechis...");
        } else {
            /* Autant le dire tout de suite plutot que d'attendre pour rien :
             * sans cerveau relie, personne ne repondra jamais. */
            vue_mascotte_dire(
                app->mascotte, "Le cerveau ne semble pas branche. J'essaie quand meme...");
        }
        dauphin_armer_attente(app);
    }

    scene_manager_search_and_switch_to_previous_scene(app->scene_manager, DauphinSceneAccueil);
    return true;
}

void dauphin_scene_demande_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    text_input_reset(app->text_input);
}
