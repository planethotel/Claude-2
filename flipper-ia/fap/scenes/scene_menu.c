#include "../dauphin_ia_i.h"

typedef enum {
    MenuAnalyser,
    MenuDemander,
    MenuPropositions,
    MenuReglages,
} MenuEntree;

static void dauphin_scene_menu_rappel(void* contexte, uint32_t indice) {
    DauphinIa* app = contexte;
    view_dispatcher_send_custom_event(app->view_dispatcher, indice);
}

void dauphin_scene_menu_on_enter(void* contexte) {
    DauphinIa* app = contexte;
    Submenu* menu = app->submenu;

    submenu_reset(menu);
    submenu_set_header(menu, "IA Dauphin");
    submenu_add_item(menu, "Regarde ce que j'ai", MenuAnalyser, dauphin_scene_menu_rappel, app);
    submenu_add_item(menu, "Je te demande...", MenuDemander, dauphin_scene_menu_rappel, app);

    char etiquette[32];
    snprintf(etiquette, sizeof(etiquette), "Propositions (%u)", (unsigned)app->propositions_nb);
    submenu_add_item(menu, etiquette, MenuPropositions, dauphin_scene_menu_rappel, app);

    submenu_add_item(menu, "Reglages du lien", MenuReglages, dauphin_scene_menu_rappel, app);

    view_dispatcher_switch_to_view(app->view_dispatcher, VueSubmenuId);
}

bool dauphin_scene_menu_on_event(void* contexte, SceneManagerEvent evenement) {
    DauphinIa* app = contexte;
    if(evenement.type != SceneManagerEventTypeCustom) return false;

    switch(evenement.event) {
    case MenuAnalyser:
        dauphin_envoyer_inventaire(app);
        scene_manager_previous_scene(app->scene_manager);
        return true;
    case MenuDemander:
        scene_manager_next_scene(app->scene_manager, DauphinSceneDemande);
        return true;
    case MenuPropositions:
        if(app->propositions_nb > 0) {
            scene_manager_next_scene(app->scene_manager, DauphinScenePropositions);
        }
        return true;
    case MenuReglages:
        scene_manager_next_scene(app->scene_manager, DauphinSceneReglages);
        return true;
    default:
        return false;
    }
}

void dauphin_scene_menu_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    submenu_reset(app->submenu);
}
