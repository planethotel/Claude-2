#include "../dauphin_ia_i.h"

/** Rappel des touches de la vue mascotte. */
static void dauphin_scene_accueil_rappel(VueMascotteEvt evenement, void* contexte) {
    DauphinIa* app = contexte;
    switch(evenement) {
    case VueMascotteEvtMenu:
        view_dispatcher_send_custom_event(app->view_dispatcher, DauphinEvtMenu);
        break;
    case VueMascotteEvtDemander:
        view_dispatcher_send_custom_event(app->view_dispatcher, DauphinEvtDemander);
        break;
    case VueMascotteEvtPropositions:
        view_dispatcher_send_custom_event(app->view_dispatcher, DauphinEvtPropositions);
        break;
    case VueMascotteEvtReveil:
        dauphin_envoyer_inventaire(app);
        break;
    }
}

void dauphin_scene_accueil_on_enter(void* contexte) {
    DauphinIa* app = contexte;
    vue_mascotte_set_rappel(app->mascotte, dauphin_scene_accueil_rappel, app);
    vue_mascotte_set_propositions(app->mascotte, app->propositions_nb);
    view_dispatcher_switch_to_view(app->view_dispatcher, VueMascotteId);
}

bool dauphin_scene_accueil_on_event(void* contexte, SceneManagerEvent evenement) {
    DauphinIa* app = contexte;

    if(evenement.type == SceneManagerEventTypeTick) {
        dauphin_pouls(app);
        return true;
    }

    if(evenement.type != SceneManagerEventTypeCustom) return false;

    switch(evenement.event) {
    case DauphinEvtMenu:
        scene_manager_next_scene(app->scene_manager, DauphinSceneMenu);
        return true;
    case DauphinEvtDemander:
        scene_manager_next_scene(app->scene_manager, DauphinSceneDemande);
        return true;
    case DauphinEvtPropositions:
        if(app->propositions_nb > 0) {
            scene_manager_next_scene(app->scene_manager, DauphinScenePropositions);
        } else {
            vue_mascotte_dire(app->mascotte, "Rien a proposer pour l'instant.");
        }
        return true;
    default:
        return false;
    }
}

void dauphin_scene_accueil_on_exit(void* contexte) {
    UNUSED(contexte);
}
