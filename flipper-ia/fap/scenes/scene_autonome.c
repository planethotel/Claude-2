#include "../dauphin_ia_i.h"
#include "../contexte/savoir.h"

/**
 * Identification directe sur l'appareil, sans passer par le cerveau : relit
 * l'inventaire et cherche chaque protocole dans le petit dictionnaire embarque
 * (contexte/savoir.c). Fonctionne meme sans ordinateur branche -- c'est le prix
 * a payer : pas de conversation, pas de proposition generee, juste une fiche
 * d'identite par objet.
 */

void dauphin_scene_autonome_on_enter(void* contexte) {
    DauphinIa* app = contexte;

    size_t nb = inventaire_scanner(app->inventaire);

    widget_reset(app->widget);
    widget_add_string_element(
        app->widget, 64, 2, AlignCenter, AlignTop, FontPrimary, "Identification seule");

    FuriString* corps = furi_string_alloc();
    if(nb == 0) {
        furi_string_set_str(
            corps,
            "Rien dans tes dossiers de capture pour l'instant.\n\n"
            "Ceci est le dictionnaire embarque : moins complet que le "
            "cerveau, mais toujours disponible, meme sans ordinateur.");
    } else {
        for(size_t i = 0; i < nb; i++) {
            const InventaireObjet* objet = &app->inventaire->objets[i];
            const SavoirFiche* fiche = savoir_chercher(objet->categorie, objet->proto);

            furi_string_cat_printf(corps, "%u. %s\n", (unsigned)(i + 1), objet->nom);
            if(fiche) {
                furi_string_cat_printf(
                    corps,
                    "   %s (%s)\n   %s\n\n",
                    fiche->proto,
                    savoir_nom_categorie(objet->categorie),
                    fiche->resume);
            } else if(objet->proto[0]) {
                furi_string_cat_printf(
                    corps,
                    "   %s (%s)\n   Protocole non repertorie dans le "
                    "dictionnaire embarque.\n\n",
                    objet->proto,
                    savoir_nom_categorie(objet->categorie));
            } else {
                furi_string_cat_printf(
                    corps, "   %s -- type inconnu.\n\n", savoir_nom_categorie(objet->categorie));
            }
        }
    }

    widget_add_text_scroll_element(app->widget, 0, 14, 128, 50, furi_string_get_cstr(corps));
    furi_string_free(corps);

    view_dispatcher_switch_to_view(app->view_dispatcher, VueWidgetId);
}

bool dauphin_scene_autonome_on_event(void* contexte, SceneManagerEvent evenement) {
    UNUSED(contexte);
    UNUSED(evenement);
    return false;
}

void dauphin_scene_autonome_on_exit(void* contexte) {
    DauphinIa* app = contexte;
    widget_reset(app->widget);
}
