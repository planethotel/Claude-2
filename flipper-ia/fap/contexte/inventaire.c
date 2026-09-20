#include "inventaire.h"

#include <flipper_format/flipper_format.h>
#include <string.h>

#define TAG "DauphinInv"

typedef struct {
    const char* categorie;
    const char* dossier;
    const char* extension;
} InventaireSource;

static const InventaireSource inventaire_sources[] = {
    {"subghz", EXT_PATH("subghz"), ".sub"},
    {"nfc", EXT_PATH("nfc"), ".nfc"},
    {"lfrfid", EXT_PATH("lfrfid"), ".rfid"},
    {"infrared", EXT_PATH("infrared"), ".ir"},
    {"ibutton", EXT_PATH("ibutton"), ".ibtn"},
    {"badusb", EXT_PATH("badusb"), ".txt"},
};

static bool inventaire_extension_ok(const char* nom, const char* extension) {
    size_t len_nom = strlen(nom);
    size_t len_ext = strlen(extension);
    if(len_nom <= len_ext) return false;
    return strcasecmp(nom + len_nom - len_ext, extension) == 0;
}

/** Formate un tableau d'octets en hexadecimal majuscule. */
static void inventaire_hex(char* dst, size_t dst_taille, const uint8_t* octets, size_t nb) {
    size_t j = 0;
    for(size_t i = 0; i < nb && j + 3 < dst_taille; i++) {
        static const char chiffres[] = "0123456789ABCDEF";
        dst[j++] = chiffres[octets[i] >> 4];
        dst[j++] = chiffres[octets[i] & 0x0F];
    }
    dst[j] = '\0';
}

/** Lit une valeur hexadecimale de longueur inconnue et la formate. */
static void inventaire_lire_hex(
    FlipperFormat* format,
    const char* cle,
    char* dst,
    size_t dst_taille,
    size_t max_octets) {
    dst[0] = '\0';

    uint32_t nb = 0;
    if(!flipper_format_get_value_count(format, cle, &nb)) return;
    if(nb == 0) return;
    if(nb > max_octets) nb = max_octets;

    uint8_t tampon[16];
    if(nb > sizeof(tampon)) nb = sizeof(tampon);
    if(!flipper_format_read_hex(format, cle, tampon, nb)) return;

    inventaire_hex(dst, dst_taille, tampon, nb);
}

/** Lit l'en-tete d'un fichier capture et remplit l'objet. */
static void inventaire_lire_entete(
    Inventaire* inventaire,
    const InventaireSource* source,
    const char* chemin,
    InventaireObjet* objet) {
    /* Le BadUSB n'est pas au format Flipper Format : on s'arrete au nom. */
    if(strcmp(source->categorie, "badusb") == 0) {
        strlcpy(objet->proto, "DuckyScript", sizeof(objet->proto));
        return;
    }

    FlipperFormat* format = flipper_format_file_alloc(inventaire->storage);
    FuriString* valeur = furi_string_alloc();

    do {
        if(!flipper_format_file_open_existing(format, chemin)) break;

        if(strcmp(source->categorie, "subghz") == 0) {
            if(flipper_format_read_string(format, "Protocol", valeur)) {
                strlcpy(objet->proto, furi_string_get_cstr(valeur), sizeof(objet->proto));
            }
            flipper_format_rewind(format);
            uint32_t frequence = 0;
            if(flipper_format_read_uint32(format, "Frequency", &frequence, 1)) {
                objet->frequence = frequence;
            }
            flipper_format_rewind(format);
            if(flipper_format_read_string(format, "Preset", valeur)) {
                strlcpy(objet->detail, furi_string_get_cstr(valeur), sizeof(objet->detail));
            }

        } else if(strcmp(source->categorie, "nfc") == 0) {
            if(flipper_format_read_string(format, "Device type", valeur)) {
                strlcpy(objet->proto, furi_string_get_cstr(valeur), sizeof(objet->proto));
            }
            flipper_format_rewind(format);
            inventaire_lire_hex(format, "UID", objet->detail, sizeof(objet->detail), 10);

        } else if(strcmp(source->categorie, "lfrfid") == 0) {
            if(flipper_format_read_string(format, "Key type", valeur)) {
                strlcpy(objet->proto, furi_string_get_cstr(valeur), sizeof(objet->proto));
            }
            flipper_format_rewind(format);
            inventaire_lire_hex(format, "Data", objet->detail, sizeof(objet->detail), 8);

        } else if(strcmp(source->categorie, "infrared") == 0) {
            if(flipper_format_read_string(format, "protocol", valeur)) {
                strlcpy(objet->proto, furi_string_get_cstr(valeur), sizeof(objet->proto));
            } else {
                strlcpy(objet->proto, "Raw", sizeof(objet->proto));
            }
            flipper_format_rewind(format);
            if(flipper_format_read_string(format, "name", valeur)) {
                strlcpy(objet->detail, furi_string_get_cstr(valeur), sizeof(objet->detail));
            }

        } else if(strcmp(source->categorie, "ibutton") == 0) {
            if(flipper_format_read_string(format, "Protocol", valeur)) {
                strlcpy(objet->proto, furi_string_get_cstr(valeur), sizeof(objet->proto));
            }
            flipper_format_rewind(format);
            inventaire_lire_hex(format, "Data", objet->detail, sizeof(objet->detail), 8);
        }
    } while(false);

    furi_string_free(valeur);
    flipper_format_file_close(format);
    flipper_format_free(format);
}

static size_t inventaire_scanner_source(Inventaire* inventaire, const InventaireSource* source) {
    File* dossier = storage_file_alloc(inventaire->storage);
    size_t trouves = 0;

    if(storage_dir_open(dossier, source->dossier)) {
        FileInfo info;
        char nom[64];
        while(inventaire->nb < INVENTAIRE_MAX && trouves < INVENTAIRE_MAX_PAR_CATEGORIE) {
            if(!storage_dir_read(dossier, &info, nom, sizeof(nom))) break;
            if(file_info_is_dir(&info)) continue;
            if(!inventaire_extension_ok(nom, source->extension)) continue;

            InventaireObjet* objet = &inventaire->objets[inventaire->nb];
            memset(objet, 0, sizeof(InventaireObjet));
            strlcpy(objet->categorie, source->categorie, sizeof(objet->categorie));
            strlcpy(objet->nom, nom, sizeof(objet->nom));

            FuriString* chemin = furi_string_alloc_printf("%s/%s", source->dossier, nom);
            inventaire_lire_entete(inventaire, source, furi_string_get_cstr(chemin), objet);
            furi_string_free(chemin);

            inventaire->nb++;
            trouves++;
        }
    }

    storage_dir_close(dossier);
    storage_file_free(dossier);
    return trouves;
}

Inventaire* inventaire_alloc(Storage* storage) {
    furi_assert(storage);
    Inventaire* inventaire = malloc(sizeof(Inventaire));
    memset(inventaire, 0, sizeof(Inventaire));
    inventaire->storage = storage;
    return inventaire;
}

void inventaire_free(Inventaire* inventaire) {
    furi_assert(inventaire);
    free(inventaire);
}

size_t inventaire_scanner(Inventaire* inventaire) {
    furi_assert(inventaire);
    inventaire->nb = 0;

    for(size_t i = 0; i < COUNT_OF(inventaire_sources); i++) {
        if(inventaire->nb >= INVENTAIRE_MAX) break;
        size_t trouves = inventaire_scanner_source(inventaire, &inventaire_sources[i]);
        FURI_LOG_D(TAG, "%s: %zu", inventaire_sources[i].categorie, trouves);
    }

    return inventaire->nb;
}

size_t inventaire_compter(const Inventaire* inventaire, const char* categorie) {
    furi_assert(inventaire);
    size_t n = 0;
    for(size_t i = 0; i < inventaire->nb; i++) {
        if(strcmp(inventaire->objets[i].categorie, categorie) == 0) n++;
    }
    return n;
}
