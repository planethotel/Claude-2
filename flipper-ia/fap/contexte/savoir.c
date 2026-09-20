#include "savoir.h"

#include <string.h>

/* Recopie condensee des fiches JSON de cerveau/dauphin/savoir/ -- voir savoir.h. */
static const SavoirFiche savoir_fiches[] = {
    /* --- NFC (champ "Device type", 13,56 MHz) --- */
    {"nfc",
     "Mifare Classic",
     "Carte NXP tres repandue : badges de bureau, transports, hotels. "
     "Memoire en secteurs proteges par des cles."},
    {"nfc",
     "Mifare DESFire",
     "Carte plus moderne et mieux protegee que la Classic, courante dans "
     "les transports recents."},
    {"nfc",
     "NTAG",
     "Petite etiquette bon marche (affiche, jouet, carte de visite NFC). "
     "Souvent lisible librement."},
    {"nfc",
     "Ultralight",
     "Petite etiquette bon marche (affiche, jouet, carte de visite NFC). "
     "Souvent lisible librement."},
    {"nfc", "FeliCa", "Norme Sony, tres presente au Japon (transports, paiement)."},
    {"nfc",
     "SLIX",
     "Etiquette longue portee (ISO15693), utilisee en bibliotheque et en "
     "logistique."},

    /* --- RFID 125 kHz (champ "Key type") --- */
    {"lfrfid",
     "EM4100",
     "Le badge bas de gamme le plus courant : interphones, parkings, "
     "salles de sport. Identifiant fixe, pas de chiffrement."},
    {"lfrfid",
     "HIDProx",
     "Format HID Prox, tres present dans les immeubles de bureaux "
     "nord-americains."},
    {"lfrfid",
     "Indala",
     "Ancien format Motorola/Indala, encore installe dans des sites "
     "anciens."},
    {"lfrfid", "AWID", "Format AWID, controle d'acces d'entreprise."},

    /* --- Sub-GHz (champ "Protocol") --- */
    {"subghz",
     "Princeton",
     "Encodeur PT2262 et compatibles, 315/433 MHz : anciennes "
     "telecommandes de portail, sonnettes, prises radio a code fixe."},
    {"subghz", "CAME", "Telecommande de portail CAME a code fixe."},
    {"subghz", "NICE", "Telecommande Nice a code fixe."},
    {"subghz",
     "KeeLoq",
     "Systeme a code tournant (voitures, portails recents). Chaque appui "
     "change le code : une simple copie ne rejoue pas."},
    {"subghz",
     "RAW",
     "Capture brute du signal, sans decodage de protocole."},

    /* --- Infrarouge (champ "protocol", ou Raw) --- */
    {"infrared",
     "NEC",
     "Le protocole IR le plus courant : televiseurs, box, climatiseurs "
     "asiatiques."},
    {"infrared",
     "RC5",
     "Ancien protocole Philips, encore present sur du materiel europeen."},
    {"infrared", "Samsung", "Variante utilisee par les televiseurs Samsung."},
    {"infrared",
     "Raw",
     "Capture brute d'une trame IR non reconnue."},
};

#define SAVOIR_NB (sizeof(savoir_fiches) / sizeof(savoir_fiches[0]))

const SavoirFiche* savoir_chercher(const char* categorie, const char* proto) {
    if(!categorie || !proto || !*proto) return NULL;

    for(size_t i = 0; i < SAVOIR_NB; i++) {
        const SavoirFiche* fiche = &savoir_fiches[i];
        if(strcmp(fiche->categorie, categorie) != 0) continue;
        /* Prefixe insensible a la casse, comme la version Python. */
        if(strncasecmp(proto, fiche->proto, strlen(fiche->proto)) == 0) return fiche;
    }
    return NULL;
}

const char* savoir_nom_categorie(const char* categorie) {
    if(!categorie) return "?";
    if(strcmp(categorie, "subghz") == 0) return "radio sous 1 GHz";
    if(strcmp(categorie, "nfc") == 0) return "carte 13,56 MHz";
    if(strcmp(categorie, "lfrfid") == 0) return "badge 125 kHz";
    if(strcmp(categorie, "infrared") == 0) return "infrarouge";
    if(strcmp(categorie, "ibutton") == 0) return "iButton (contact)";
    if(strcmp(categorie, "badusb") == 0) return "clavier automatique (BadUSB)";
    return categorie;
}
