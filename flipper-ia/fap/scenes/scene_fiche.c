#include "../dauphin_ia_i.h"

void dauphin_scene_fiche_on_enter(void* contexte) {
    DauphinIa* app = contexte;

    widget_reset(app->widget);
    widget_add_string_element(
        app->widget,
        64,
        2,
        AlignCenter,
        AlignTop,
        FontPrimary,
        furi_string_get_cstr(app->fiche_titre));
    widget_add_text_scroll_element(
        app->widget, 0, 14, 128, 50, furi_string_get_cstr(app->fiche_corps));

    view_dispatcher_switch_to_view(app->view_dispatcher, VueWidgetId);
}

bool dauphin_scene_fiche_on_event(void* contexte, SceneManagerEvent evenement) {
    UNUSED(contexte);
    UNUSED(evenement);
    return false;
}

void dauphin_scene_fiche_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    widget_reset(app->widget);
}
