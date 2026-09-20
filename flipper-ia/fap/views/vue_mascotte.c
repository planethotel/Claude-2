#include "vue_mascotte.h"

#include <furi.h>
#include <gui/icon_animation.h>
#include <string.h>

#include "dauphin_ia_icons.h"

#define BULLE_MAX 200
#define ETAT_MAX 24

/* Mise en page (ecran 128 x 64). */
#define MASCOTTE_X 92
#define MASCOTTE_Y 18
#define BULLE_X 1
#define BULLE_Y 1
#define BULLE_L 86
#define BULLE_H 46
#define BARRE_Y 54

typedef struct {
    Humeur humeur;
    char bulle[BULLE_MAX];
    char etat[ETAT_MAX];
    uint8_t batterie;
    size_t propositions;
    /** Decalage vertical de la bulle quand le texte deborde. */
    int32_t defilement;
    /** Animation courante : le dessin en a besoin, elle vit donc dans le modele. */
    IconAnimation* animation;
} VueMascotteModele;

struct VueMascotte {
    View* view;
    IconAnimation* animation;
    VueMascotteRappel rappel;
    void* contexte;
};

static const Icon* const vue_mascotte_animations[HumeurNb] = {
    [HumeurRepos] = &A_dauphin_repos,
    [HumeurEcoute] = &A_dauphin_ecoute,
    [HumeurReflechit] = &A_dauphin_reflechit,
    [HumeurContent] = &A_dauphin_content,
    [HumeurSurpris] = &A_dauphin_surpris,
    [HumeurInquiet] = &A_dauphin_inquiet,
    [HumeurDort] = &A_dauphin_dort,
};

static const char* const vue_mascotte_noms[HumeurNb] = {
    [HumeurRepos] = "repos",
    [HumeurEcoute] = "ecoute",
    [HumeurReflechit] = "reflechit",
    [HumeurContent] = "content",
    [HumeurSurpris] = "surpris",
    [HumeurInquiet] = "inquiet",
    [HumeurDort] = "dort",
};

Humeur vue_mascotte_humeur_depuis_texte(const char* texte) {
    if(!texte) return HumeurRepos;
    for(size_t i = 0; i < HumeurNb; i++) {
        if(strcmp(texte, vue_mascotte_noms[i]) == 0) return (Humeur)i;
    }
    return HumeurRepos;
}

/* ------------------------------------------------------------------ */
/* Dessin                                                             */
/* ------------------------------------------------------------------ */

/**
 * @brief Ecrit un texte dans la bulle en le coupant aux espaces.
 * @return nombre de lignes reellement dessinees
 */
static int32_t vue_mascotte_dessiner_texte(
    Canvas* canvas,
    const char* texte,
    int32_t x,
    int32_t y,
    size_t largeur,
    size_t hauteur,
    int32_t defilement) {
    const size_t interligne = 9;
    char ligne[48];
    size_t ligne_len = 0;
    int32_t numero = 0;

    const char* mot = texte;
    while(true) {
        /* Isole le mot suivant (espaces inclus en fin). */
        const char* fin_mot = mot;
        while(*fin_mot && *fin_mot != ' ' && *fin_mot != '\n') fin_mot++;
        size_t mot_len = (size_t)(fin_mot - mot);

        bool saut = (*fin_mot == '\n');
        bool fini = (*fin_mot == '\0');

        /* Le mot tient-il sur la ligne courante ? */
        char essai[48];
        size_t essai_len = ligne_len;
        if(essai_len && essai_len + 1 < sizeof(essai)) {
            memcpy(essai, ligne, ligne_len);
            essai[essai_len++] = ' ';
        }
        size_t copie = mot_len;
        if(essai_len + copie >= sizeof(essai)) copie = sizeof(essai) - essai_len - 1;
        memcpy(essai + essai_len, mot, copie);
        essai[essai_len + copie] = '\0';

        if(canvas_string_width(canvas, essai) <= largeur || ligne_len == 0) {
            strlcpy(ligne, essai, sizeof(ligne));
            ligne_len = strlen(ligne);
        } else {
            /* Ligne pleine : on la sort et on recommence avec le mot. */
            int32_t ly = y + (numero - defilement) * (int32_t)interligne;
            if(numero >= defilement && ly < y + (int32_t)hauteur) {
                canvas_draw_str(canvas, x, ly + 7, ligne);
            }
            numero++;
            strlcpy(ligne, "", sizeof(ligne));
            ligne_len = 0;
            continue; /* on retraite le meme mot */
        }

        if(saut || fini) {
            int32_t ly = y + (numero - defilement) * (int32_t)interligne;
            if(numero >= defilement && ly < y + (int32_t)hauteur) {
                canvas_draw_str(canvas, x, ly + 7, ligne);
            }
            numero++;
            ligne[0] = '\0';
            ligne_len = 0;
            if(fini) break;
        }

        mot = fin_mot;
        while(*mot == ' ' || *mot == '\n') mot++;
        if(!*mot && !ligne_len) break;
    }

    return numero;
}

static void vue_mascotte_dessiner(Canvas* canvas, void* modele) {
    VueMascotteModele* m = modele;

    canvas_clear(canvas);
    canvas_set_color(canvas, ColorBlack);

    /* La mascotte, a droite. */
    if(m->animation) {
        canvas_draw_icon_animation(canvas, MASCOTTE_X, MASCOTTE_Y, m->animation);
    }

    /* Bulle de dialogue. */
    canvas_draw_rframe(canvas, BULLE_X, BULLE_Y, BULLE_L, BULLE_H, 3);
    canvas_set_font(canvas, FontSecondary);
    int32_t lignes = vue_mascotte_dessiner_texte(
        canvas, m->bulle, BULLE_X + 3, BULLE_Y + 3, BULLE_L - 6, BULLE_H - 6, m->defilement);

    /* Fleche « il y a la suite ». */
    if(lignes - m->defilement > (BULLE_H - 6) / 9) {
        canvas_draw_str(canvas, BULLE_X + BULLE_L - 8, BULLE_Y + BULLE_H - 2, "v");
    }

    /* Pastille du nombre de propositions en attente.
     * DAUPHIN_PROPOSITIONS_MAX borne la vraie valeur a un seul chiffre, mais le
     * tampon est dimensionne pour n'importe quel "unsigned" (10 chiffres + le
     * caractere nul) : GCC ne peut pas prouver la borne reelle depuis le type
     * size_t et refuse sinon de compiler (-Werror=format-truncation). */
    if(m->propositions > 0) {
        char pastille[12];
        snprintf(pastille, sizeof(pastille), "%u", (unsigned)m->propositions);
        canvas_draw_disc(canvas, BULLE_X + BULLE_L - 6, BULLE_Y + 6, 6);
        canvas_set_color(canvas, ColorWhite);
        canvas_draw_str_aligned(
            canvas, BULLE_X + BULLE_L - 6, BULLE_Y + 6, AlignCenter, AlignCenter, pastille);
        canvas_set_color(canvas, ColorBlack);
    }

    /* Barre d'etat. */
    canvas_draw_line(canvas, 0, BARRE_Y - 2, 127, BARRE_Y - 2);
    char barre[40];
    snprintf(barre, sizeof(barre), "%s  %u%%", m->etat, (unsigned)m->batterie);
    canvas_draw_str(canvas, 2, BARRE_Y + 6, barre);
    canvas_draw_str_aligned(canvas, 126, BARRE_Y + 6, AlignRight, AlignBottom, "OK=menu");
}

/* ------------------------------------------------------------------ */
/* Entrees                                                            */
/* ------------------------------------------------------------------ */

static bool vue_mascotte_entree(InputEvent* evenement, void* contexte) {
    VueMascotte* vue = contexte;

    if(evenement->type != InputTypeShort) return false;

    VueMascotteEvt sortie;
    switch(evenement->key) {
    case InputKeyOk:
        sortie = VueMascotteEvtMenu;
        break;
    case InputKeyRight:
        sortie = VueMascotteEvtDemander;
        break;
    case InputKeyLeft:
        sortie = VueMascotteEvtPropositions;
        break;
    case InputKeyUp:
        sortie = VueMascotteEvtReveil;
        break;
    case InputKeyDown: {
        /* Defilement de la bulle. */
        with_view_model(
            vue->view, VueMascotteModele * m, { m->defilement++; }, true);
        return true;
    }
    default:
        return false;
    }

    if(vue->rappel) vue->rappel(sortie, vue->contexte);
    return true;
}

/* ------------------------------------------------------------------ */
/* Cycle de vie                                                       */
/* ------------------------------------------------------------------ */

static void vue_mascotte_entrer(void* contexte) {
    VueMascotte* vue = contexte;
    if(vue->animation) icon_animation_start(vue->animation);
}

static void vue_mascotte_sortir(void* contexte) {
    VueMascotte* vue = contexte;
    if(vue->animation) icon_animation_stop(vue->animation);
}

/** Libere l'animation courante et l'efface du modele. */
static void vue_mascotte_liberer_animation(VueMascotte* vue) {
    if(!vue->animation) return;
    with_view_model(
        vue->view, VueMascotteModele * m, { m->animation = NULL; }, false);
    icon_animation_stop(vue->animation);
    icon_animation_free(vue->animation);
    vue->animation = NULL;
}

static void vue_mascotte_animation_maj(IconAnimation* instance, void* contexte) {
    UNUSED(instance);
    VueMascotte* vue = contexte;
    /* Force un rafraichissement : l'animation a change de trame. */
    with_view_model(
        vue->view, VueMascotteModele * m, { UNUSED(m); }, true);
}

VueMascotte* vue_mascotte_alloc(void) {
    VueMascotte* vue = malloc(sizeof(VueMascotte));
    memset(vue, 0, sizeof(VueMascotte));

    vue->view = view_alloc();
    view_set_context(vue->view, vue);
    view_allocate_model(vue->view, ViewModelTypeLocking, sizeof(VueMascotteModele));
    view_set_draw_callback(vue->view, vue_mascotte_dessiner);
    view_set_input_callback(vue->view, vue_mascotte_entree);
    view_set_enter_callback(vue->view, vue_mascotte_entrer);
    view_set_exit_callback(vue->view, vue_mascotte_sortir);

    with_view_model(
        vue->view,
        VueMascotteModele * m,
        {
            m->humeur = HumeurRepos;
            m->batterie = 0;
            strlcpy(m->etat, "hors ligne", sizeof(m->etat));
            strlcpy(m->bulle, "Bonjour. Branche le cerveau et je regarde ce que tu as.", sizeof(m->bulle));
        },
        false);

    vue_mascotte_set_humeur(vue, HumeurRepos);
    return vue;
}

void vue_mascotte_free(VueMascotte* vue) {
    furi_assert(vue);
    vue_mascotte_liberer_animation(vue);
    view_free(vue->view);
    free(vue);
}

View* vue_mascotte_get_view(VueMascotte* vue) {
    furi_assert(vue);
    return vue->view;
}

void vue_mascotte_set_rappel(VueMascotte* vue, VueMascotteRappel rappel, void* contexte) {
    furi_assert(vue);
    vue->rappel = rappel;
    vue->contexte = contexte;
}

void vue_mascotte_set_humeur(VueMascotte* vue, Humeur humeur) {
    furi_assert(vue);
    if(humeur >= HumeurNb) humeur = HumeurRepos;

    bool inchange = false;
    with_view_model(
        vue->view,
        VueMascotteModele * m,
        {
            inchange = (m->humeur == humeur) && (vue->animation != NULL);
            m->humeur = humeur;
        },
        false);
    if(inchange) return;

    vue_mascotte_liberer_animation(vue);
    vue->animation = icon_animation_alloc(vue_mascotte_animations[humeur]);
    icon_animation_set_update_callback(vue->animation, vue_mascotte_animation_maj, vue);
    icon_animation_start(vue->animation);

    with_view_model(
        vue->view, VueMascotteModele * m, { m->animation = vue->animation; }, true);
}

Humeur vue_mascotte_get_humeur(const VueMascotte* vue) {
    furi_assert(vue);
    Humeur humeur = HumeurRepos;
    with_view_model(
        ((VueMascotte*)vue)->view, VueMascotteModele * m, { humeur = m->humeur; }, false);
    return humeur;
}

void vue_mascotte_dire(VueMascotte* vue, const char* texte) {
    furi_assert(vue);
    with_view_model(
        vue->view,
        VueMascotteModele * m,
        {
            strlcpy(m->bulle, texte ? texte : "", sizeof(m->bulle));
            m->defilement = 0;
        },
        true);
}

void vue_mascotte_set_etat(VueMascotte* vue, const char* etat, uint8_t batterie) {
    furi_assert(vue);
    with_view_model(
        vue->view,
        VueMascotteModele * m,
        {
            if(etat) strlcpy(m->etat, etat, sizeof(m->etat));
            m->batterie = batterie;
        },
        true);
}

void vue_mascotte_set_propositions(VueMascotte* vue, size_t nb) {
    furi_assert(vue);
    with_view_model(
        vue->view, VueMascotteModele * m, { m->propositions = nb; }, true);
}
