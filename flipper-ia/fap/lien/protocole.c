#include "protocole.h"

#include <stdarg.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    const char* nom;
    ProtoType type;
} ProtoNom;

static const ProtoNom proto_noms[] = {
    {"HUMEUR", ProtoTypeHumeur},
    {"DIRE", ProtoTypeDire},
    {"PROPOSITIONS", ProtoTypePropositions},
    {"PROPOSITION", ProtoTypeProposition},
    {"FICHE", ProtoTypeFiche},
    {"EXEC", ProtoTypeExec},
    {"ERREUR", ProtoTypeErreur},
};

/** Copie @p src dans @p dst en resolvant les echappements \\ \t \n. */
static void proto_desechapper(char* dst, size_t dst_taille, const char* src, size_t src_taille) {
    size_t j = 0;
    for(size_t i = 0; i < src_taille && j + 1 < dst_taille; i++) {
        char c = src[i];
        if(c == '\\' && i + 1 < src_taille) {
            i++;
            switch(src[i]) {
            case 'n':
                c = '\n';
                break;
            case 't':
                c = '\t';
                break;
            case '\\':
                c = '\\';
                break;
            default:
                c = src[i];
                break;
            }
        }
        dst[j++] = c;
    }
    dst[j] = '\0';
}

bool proto_parser(const char* ligne, ProtoTrame* out) {
    furi_assert(ligne);
    furi_assert(out);

    out->type = ProtoTypeInconnu;
    out->nb = 0;

    /* Type : jusqu'a la premiere tabulation. */
    const char* fin_type = strchr(ligne, '\t');
    size_t taille_type = fin_type ? (size_t)(fin_type - ligne) : strlen(ligne);
    for(size_t i = 0; i < COUNT_OF(proto_noms); i++) {
        if(strlen(proto_noms[i].nom) == taille_type &&
           strncmp(ligne, proto_noms[i].nom, taille_type) == 0) {
            out->type = proto_noms[i].type;
            break;
        }
    }
    if(out->type == ProtoTypeInconnu) return false;
    if(!fin_type) return true;

    /* Champs. */
    const char* p = fin_type + 1;
    while(*p && out->nb < PROTO_CHAMPS_MAX) {
        const char* fin_champ = strchr(p, '\t');
        size_t taille_champ = fin_champ ? (size_t)(fin_champ - p) : strlen(p);

        const char* egal = memchr(p, '=', taille_champ);
        if(egal) {
            ProtoChamp* champ = &out->champs[out->nb];
            size_t taille_cle = (size_t)(egal - p);
            if(taille_cle >= PROTO_CLE_MAX) taille_cle = PROTO_CLE_MAX - 1;
            memcpy(champ->cle, p, taille_cle);
            champ->cle[taille_cle] = '\0';

            proto_desechapper(
                champ->val, PROTO_VAL_MAX, egal + 1, taille_champ - (size_t)(egal + 1 - p));
            out->nb++;
        }

        if(!fin_champ) break;
        p = fin_champ + 1;
    }
    return true;
}

const char* proto_champ(const ProtoTrame* trame, const char* cle, const char* defaut) {
    furi_assert(trame);
    for(size_t i = 0; i < trame->nb; i++) {
        if(strcmp(trame->champs[i].cle, cle) == 0) return trame->champs[i].val;
    }
    return defaut;
}

uint32_t proto_champ_u32(const ProtoTrame* trame, const char* cle, uint32_t defaut) {
    const char* val = proto_champ(trame, cle, NULL);
    if(!val || *val == '\0') return defaut;
    char* fin = NULL;
    unsigned long v = strtoul(val, &fin, 10);
    if(fin == val) return defaut;
    return (uint32_t)v;
}

ProtoRisque proto_risque(const char* texte) {
    if(!texte) return ProtoRisqueSur;
    if(strcmp(texte, "emission") == 0) return ProtoRisqueEmission;
    if(strcmp(texte, "local") == 0) return ProtoRisqueLocal;
    return ProtoRisqueSur;
}

ProtoActe proto_acte(const char* texte) {
    if(!texte) return ProtoActeRien;
    if(strcmp(texte, "ouvrir_app") == 0) return ProtoActeOuvrirApp;
    if(strcmp(texte, "fiche") == 0) return ProtoActeFiche;
    if(strcmp(texte, "note") == 0) return ProtoActeNote;
    if(strcmp(texte, "notifier") == 0) return ProtoActeNotifier;
    if(strcmp(texte, "inventaire") == 0) return ProtoActeInventaire;
    return ProtoActeRien;
}

/* Repliage des lettres latines accentuees (UTF-8 deux octets, plage C3 80..C3 BF). */
static const char proto_latin1[64] =
    /* C0..CF */ "AAAAAAACEEEEIIII"
    /* D0..DF */ "DNOOOOOxOUUUUYPB"
    /* E0..EF */ "aaaaaaaceeeeiiii"
    /* F0..FF */ "dnooooo/ouuuuypy";

void proto_ascii(char* dst, size_t dst_taille, const char* src) {
    furi_assert(dst);
    furi_assert(dst_taille > 0);
    if(!src) {
        dst[0] = '\0';
        return;
    }

    size_t j = 0;
    const uint8_t* p = (const uint8_t*)src;
    while(*p && j + 1 < dst_taille) {
        uint8_t c = *p;
        if(c < 0x80) {
            /* ASCII : on garde l'imprimable, on remplace le reste par une espace. */
            dst[j++] = (c >= 0x20 && c <= 0x7E) ? (char)c : ' ';
            p++;
        } else if((c == 0xC3) && p[1]) {
            uint8_t suite = p[1];
            if(suite >= 0x80 && suite <= 0xBF) {
                dst[j++] = proto_latin1[suite - 0x80];
            } else {
                dst[j++] = '?';
            }
            p += 2;
        } else if(c == 0xC2 && p[1]) {
            /* Espaces insecables, degre, etc. */
            dst[j++] = (p[1] == 0xB0) ? 'o' : ' ';
            p += 2;
        } else if(c == 0xE2 && p[1] == 0x80 && p[2]) {
            /* Ponctuation typographique : guillemets, tirets, points de suspension. */
            uint8_t suite = p[2];
            if(suite == 0x99 || suite == 0x98) {
                dst[j++] = '\'';
            } else if(suite == 0x9C || suite == 0x9D) {
                dst[j++] = '"';
            } else if(suite == 0xA6) {
                dst[j++] = '.';
            } else {
                dst[j++] = '-';
            }
            p += 3;
        } else {
            /* Toute autre sequence multi-octets : on saute les octets de continuation. */
            dst[j++] = '?';
            p++;
            while((*p & 0xC0) == 0x80) p++;
        }
    }
    dst[j] = '\0';
}

void proto_ajouter(FuriString* ligne, const char* cle, const char* valeur) {
    furi_assert(ligne);
    furi_assert(cle);
    if(!valeur) return;

    char ascii[PROTO_VAL_MAX];
    proto_ascii(ascii, sizeof(ascii), valeur);

    furi_string_cat_printf(ligne, "\t%s=", cle);
    for(const char* p = ascii; *p; p++) {
        switch(*p) {
        case '\\':
            furi_string_cat_str(ligne, "\\\\");
            break;
        case '\t':
            furi_string_cat_str(ligne, "\\t");
            break;
        case '\n':
            furi_string_cat_str(ligne, "\\n");
            break;
        default:
            furi_string_push_back(ligne, *p);
            break;
        }
    }
}

void proto_ajouter_u32(FuriString* ligne, const char* cle, uint32_t valeur) {
    furi_string_cat_printf(ligne, "\t%s=%lu", cle, (unsigned long)valeur);
}

FuriString* proto_construire(const char* type, ...) {
    furi_assert(type);
    FuriString* ligne = furi_string_alloc_set_str(type);

    va_list args;
    va_start(args, type);
    while(true) {
        const char* cle = va_arg(args, const char*);
        if(!cle) break;
        const char* valeur = va_arg(args, const char*);
        proto_ajouter(ligne, cle, valeur);
    }
    va_end(args);

    furi_string_push_back(ligne, '\n');
    return ligne;
}
