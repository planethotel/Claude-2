#include "../dauphin_ia_i.h"

static void dauphin_scene_propositions_rappel(void* contexte, uint32_t indice) {
    DauphinIa* app = contexte;
    app->proposition_choisie = indice;
    view_dispatcher_send_custom_event(app->view_dispatcher, DauphinEvtChoix);
}

void dauphin_scene_propositions_on_enter(void* contexte) {
    DauphinIa* app = contexte;
    Submenu* menu = app->submenu;

    submenu_reset(menu);
    submenu_set_header(menu, "Ce que je propose");

    for(size_t i = 0; i < app->propositions_nb; i++) {
        const DauphinProposition* prop = &app->propositions[i];
        char etiquette[48];
        /* Un point d'exclamation marque ce qui va emettre un signal. */
        snprintf(
            etiquette,
            sizeof(etiquette),
            "%s%s",
            prop->risque == ProtoRisqueEmission ? "! " : "",
            prop->titre);
        submenu_add_item(menu, etiquette, i, dauphin_scene_propositions_rappel, app);
    }

    view_dispatcher_switch_to_view(app->view_dispatcher, VueSubmenuId);
}

bool dauphin_scene_propositions_on_event(void* contexte, SceneManagerEvent evenement) {
    DauphinIa* app = contexte;
    if(evenement.type != SceneManagerEventTypeCustom) return false;
    if(evenement.event != DauphinEvtChoix) return false;

    size_t indice = app->proposition_choisie;
    if(indice >= app->propositions_nb) return true;

    const DauphinProposition* prop = &app->propositions[indice];

    if(prop->acte == ProtoActeFiche || prop->acte == ProtoActeRien) {
        /* Purement informatif : on montre le detail. */
        furi_string_set_str(app->fiche_titre, prop->titre);
        furi_string_set_str(app->fiche_corps, prop->detail);
        scene_manager_next_scene(app->scene_manager, DauphinSceneFiche);
        return true;
    }

    if(prop->risque == ProtoRisqueEmission) {
        scene_manager_next_scene(app->scene_manager, DauphinSceneConfirmation);
        return true;
    }

    dauphin_executer(app, indice);
    return true;
}

void dauphin_scene_propositions_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    submenu_reset(app->submenu);
}
