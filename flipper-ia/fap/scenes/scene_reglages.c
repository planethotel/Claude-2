#include "../dauphin_ia_i.h"

typedef enum {
    ReglageCanal,
    ReglageReconnecter,
    ReglageAPropos,
} ReglageEntree;

static void dauphin_scene_reglages_rappel(void* contexte, uint32_t indice) {
    DauphinIa* app = contexte;
    view_dispatcher_send_custom_event(app->view_dispatcher, indice);
}

static void dauphin_scene_reglages_remplir(DauphinIa* app) {
    Submenu* menu = app->submenu;
    submenu_reset(menu);
    submenu_set_header(menu, "Lien avec le cerveau");

    char etiquette[40];
    snprintf(
        etiquette,
        sizeof(etiquette),
        "Canal : %s",
        lien_get_canal(app->lien) == LienCanalUsb ? "USB" : "UART 13/14");
    submenu_add_item(menu, etiquette, ReglageCanal, dauphin_scene_reglages_rappel, app);

    const char* etat = "ferme";
    switch(lien_get_etat(app->lien)) {
    case LienEtatOuvert:
        etat = "ouvert";
        break;
    case LienEtatRelie:
        etat = "relie";
        break;
    default:
        break;
    }
    snprintf(etiquette, sizeof(etiquette), "Relancer (%s)", etat);
    submenu_add_item(menu, etiquette, ReglageReconnecter, dauphin_scene_reglages_rappel, app);

    submenu_add_item(menu, "A propos", ReglageAPropos, dauphin_scene_reglages_rappel, app);
}

void dauphin_scene_reglages_on_enter(void* contexte) {
    DauphinIa* app = contexte;
    dauphin_scene_reglages_remplir(app);
    view_dispatcher_switch_to_view(app->view_dispatcher, VueSubmenuId);
}

bool dauphin_scene_reglages_on_event(void* contexte, SceneManagerEvent evenement) {
    DauphinIa* app = contexte;
    if(evenement.type != SceneManagerEventTypeCustom) return false;

    switch(evenement.event) {
    case ReglageCanal:
        lien_arreter(app->lien);
        lien_set_canal(
            app->lien, lien_get_canal(app->lien) == LienCanalUsb ? LienCanalUart : LienCanalUsb);
        lien_demarrer(app->lien);
        dauphin_scene_reglages_remplir(app);
        return true;

    case ReglageReconnecter:
        lien_arreter(app->lien);
        lien_demarrer(app->lien);
        dauphin_envoyer_inventaire(app);
        dauphin_scene_reglages_remplir(app);
        return true;

    case ReglageAPropos:
        furi_string_set_str(app->fiche_titre, "IA Dauphin " DAUPHIN_VERSION);
        furi_string_set_str(
            app->fiche_corps,
            "Le Flipper est le corps : il voit, il montre, il execute.\n\n"
            "Le raisonnement tourne sur la machine reliee en serie (le cerveau), "
            "parce qu'un STM32WB55 avec 256 Ko de RAM ne fait pas tourner un "
            "modele de langage.\n\n"
            "Rien n'est emis sans une confirmation sur l'appareil.\n\n"
            "Protocole Ecaille v1. Voir docs/PROTOCOLE.md.");
        scene_manager_next_scene(app->scene_manager, DauphinSceneFiche);
        return true;

    default:
        return false;
    }
}

void dauphin_scene_reglages_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    submenu_reset(app->submenu);
}
