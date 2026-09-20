#include "lien.h"

#include <furi_hal.h>
#include <furi_hal_usb_cdc.h>
#include <cli/cli_vcp.h>
#include <string.h>

#define TAG "DauphinLien"

/** Canal CDC utilise : 0 reste au shell CLI. */
#define LIEN_CDC_CANAL 1
#define LIEN_USB_PAQUET 64
#define LIEN_FILE_PROFONDEUR 8
#define LIEN_FLUX_TAILLE 512

typedef enum {
    LienFlagDonnees = (1 << 0),
    LienFlagArret = (1 << 1),
} LienFlag;

#define LIEN_FLAGS_TOUS (LienFlagDonnees | LienFlagArret)

struct Lien {
    LienCanal canal;
    LienEtat etat;

    FuriThread* fil;
    FuriMessageQueue* lignes; /**< file de FuriString* */
    FuriMutex* tx_verrou;
    FuriStreamBuffer* flux; /**< UART seulement : ISR -> fil */

    /** Assemblage de la ligne en cours. */
    char tampon[PROTO_LIGNE_MAX];
    size_t tampon_len;
    bool ligne_trop_longue;

    LienRappel rappel;
    void* rappel_contexte;

    /* USB */
    CliVcp* cli_vcp;
    bool usb_configure;

    /* UART */
    FuriHalSerialHandle* serie;
};

/* ------------------------------------------------------------------ */
/* Assemblage des lignes                                              */
/* ------------------------------------------------------------------ */

static void lien_pousser_ligne(Lien* lien) {
    lien->tampon[lien->tampon_len] = '\0';

    if(lien->ligne_trop_longue) {
        FURI_LOG_W(TAG, "ligne trop longue, ignoree");
        lien->ligne_trop_longue = false;
        lien->tampon_len = 0;
        return;
    }
    if(lien->tampon_len == 0) return;

    FuriString* ligne = furi_string_alloc_set_str(lien->tampon);
    lien->tampon_len = 0;

    if(furi_message_queue_put(lien->lignes, &ligne, 0) != FuriStatusOk) {
        FURI_LOG_W(TAG, "file pleine, ligne perdue");
        furi_string_free(ligne);
        return;
    }

    lien->etat = LienEtatRelie;
    if(lien->rappel) lien->rappel(lien->rappel_contexte);
}

static void lien_absorber(Lien* lien, const uint8_t* octets, size_t taille) {
    for(size_t i = 0; i < taille; i++) {
        uint8_t c = octets[i];
        if(c == '\n') {
            lien_pousser_ligne(lien);
        } else if(c == '\r') {
            /* ignore */
        } else if(lien->tampon_len + 1 < sizeof(lien->tampon)) {
            lien->tampon[lien->tampon_len++] = (char)c;
        } else {
            lien->ligne_trop_longue = true;
        }
    }
}

/* ------------------------------------------------------------------ */
/* Rappels materiels (contexte interruption)                          */
/* ------------------------------------------------------------------ */

static void lien_cdc_rx(void* contexte) {
    Lien* lien = contexte;
    furi_thread_flags_set(furi_thread_get_id(lien->fil), LienFlagDonnees);
}

static void lien_cdc_rien(void* contexte) {
    UNUSED(contexte);
}

static void lien_cdc_etat(void* contexte, uint8_t etat) {
    Lien* lien = contexte;
    if(lien->etat != LienEtatRelie) lien->etat = etat ? LienEtatOuvert : LienEtatFerme;
}

static void lien_cdc_ligne_ctrl(void* contexte, uint8_t etat) {
    UNUSED(contexte);
    UNUSED(etat);
}

static void lien_cdc_config(void* contexte, struct usb_cdc_line_coding* config) {
    UNUSED(contexte);
    UNUSED(config);
}

static const CdcCallbacks lien_cdc_rappels = {
    lien_cdc_rien,
    lien_cdc_rx,
    lien_cdc_etat,
    lien_cdc_ligne_ctrl,
    lien_cdc_config,
};

static void lien_uart_rx(FuriHalSerialHandle* handle, FuriHalSerialRxEvent evenement, void* ctx) {
    Lien* lien = ctx;
    if(evenement & FuriHalSerialRxEventData) {
        uint8_t octet = furi_hal_serial_async_rx(handle);
        furi_stream_buffer_send(lien->flux, &octet, 1, 0);
        furi_thread_flags_set(furi_thread_get_id(lien->fil), LienFlagDonnees);
    }
}

/* ------------------------------------------------------------------ */
/* Fil de reception                                                   */
/* ------------------------------------------------------------------ */

static int32_t lien_fil(void* contexte) {
    Lien* lien = contexte;
    uint8_t tampon[LIEN_USB_PAQUET];

    while(true) {
        uint32_t flags = furi_thread_flags_wait(LIEN_FLAGS_TOUS, FuriFlagWaitAny, 250);
        if(!(flags & FuriFlagError) && (flags & LienFlagArret)) break;

        if(lien->canal == LienCanalUsb) {
            int32_t lus;
            do {
                lus = furi_hal_cdc_receive(LIEN_CDC_CANAL, tampon, sizeof(tampon));
                if(lus > 0) lien_absorber(lien, tampon, (size_t)lus);
            } while(lus > 0);
        } else {
            size_t lus;
            do {
                lus = furi_stream_buffer_receive(lien->flux, tampon, sizeof(tampon), 0);
                if(lus > 0) lien_absorber(lien, tampon, lus);
            } while(lus > 0);
        }
    }
    return 0;
}

/* ------------------------------------------------------------------ */
/* Ouverture / fermeture des canaux                                   */
/* ------------------------------------------------------------------ */

static void lien_ouvrir_usb(Lien* lien) {
    lien->cli_vcp = furi_record_open(RECORD_CLI_VCP);
    furi_hal_usb_unlock();
    /* Double CDC : le canal 0 garde le shell, le canal 1 est pour nous. */
    furi_check(furi_hal_usb_set_config(&usb_cdc_dual, NULL) == true);
    cli_vcp_enable(lien->cli_vcp);
    furi_hal_cdc_set_callbacks(LIEN_CDC_CANAL, (CdcCallbacks*)&lien_cdc_rappels, lien);
    lien->usb_configure = true;
    lien->etat = LienEtatOuvert;
}

static void lien_fermer_usb(Lien* lien) {
    if(!lien->usb_configure) return;
    furi_hal_cdc_set_callbacks(LIEN_CDC_CANAL, NULL, NULL);
    furi_hal_usb_unlock();
    furi_check(furi_hal_usb_set_config(&usb_cdc_single, NULL) == true);
    cli_vcp_enable(lien->cli_vcp);
    furi_record_close(RECORD_CLI_VCP);
    lien->cli_vcp = NULL;
    lien->usb_configure = false;
}

static void lien_ouvrir_uart(Lien* lien) {
    lien->flux = furi_stream_buffer_alloc(LIEN_FLUX_TAILLE, 1);
    lien->serie = furi_hal_serial_control_acquire(FuriHalSerialIdUsart);
    if(!lien->serie) {
        FURI_LOG_E(TAG, "USART deja prise (console ? module externe ?)");
        lien->etat = LienEtatFerme;
        return;
    }
    furi_hal_serial_init(lien->serie, LIEN_DEBIT_DEFAUT);
    furi_hal_serial_async_rx_start(lien->serie, lien_uart_rx, lien, false);
    lien->etat = LienEtatOuvert;
}

static void lien_fermer_uart(Lien* lien) {
    if(lien->serie) {
        furi_hal_serial_async_rx_stop(lien->serie);
        furi_hal_serial_deinit(lien->serie);
        furi_hal_serial_control_release(lien->serie);
        lien->serie = NULL;
    }
    if(lien->flux) {
        furi_stream_buffer_free(lien->flux);
        lien->flux = NULL;
    }
}

/* ------------------------------------------------------------------ */
/* API publique                                                       */
/* ------------------------------------------------------------------ */

Lien* lien_alloc(void) {
    Lien* lien = malloc(sizeof(Lien));
    memset(lien, 0, sizeof(Lien));
    lien->canal = LienCanalUsb;
    lien->etat = LienEtatFerme;
    lien->lignes = furi_message_queue_alloc(LIEN_FILE_PROFONDEUR, sizeof(FuriString*));
    lien->tx_verrou = furi_mutex_alloc(FuriMutexTypeNormal);
    return lien;
}

void lien_free(Lien* lien) {
    furi_assert(lien);
    lien_arreter(lien);

    FuriString* ligne = NULL;
    while(furi_message_queue_get(lien->lignes, &ligne, 0) == FuriStatusOk) {
        furi_string_free(ligne);
    }
    furi_message_queue_free(lien->lignes);
    furi_mutex_free(lien->tx_verrou);
    free(lien);
}

void lien_set_canal(Lien* lien, LienCanal canal) {
    furi_assert(lien);
    lien->canal = canal;
}

LienCanal lien_get_canal(const Lien* lien) {
    furi_assert(lien);
    return lien->canal;
}

void lien_set_rappel(Lien* lien, LienRappel rappel, void* contexte) {
    furi_assert(lien);
    lien->rappel = rappel;
    lien->rappel_contexte = contexte;
}

void lien_demarrer(Lien* lien) {
    furi_assert(lien);
    if(lien->fil) return;

    lien->tampon_len = 0;
    lien->ligne_trop_longue = false;

    lien->fil = furi_thread_alloc_ex("DauphinLien", 1024, lien_fil, lien);
    furi_thread_start(lien->fil);

    if(lien->canal == LienCanalUsb) {
        lien_ouvrir_usb(lien);
    } else {
        lien_ouvrir_uart(lien);
    }
}

void lien_arreter(Lien* lien) {
    furi_assert(lien);
    if(!lien->fil) return;

    if(lien->canal == LienCanalUsb) {
        lien_fermer_usb(lien);
    } else {
        lien_fermer_uart(lien);
    }

    furi_thread_flags_set(furi_thread_get_id(lien->fil), LienFlagArret);
    furi_thread_join(lien->fil);
    furi_thread_free(lien->fil);
    lien->fil = NULL;
    lien->etat = LienEtatFerme;
}

LienEtat lien_get_etat(const Lien* lien) {
    furi_assert(lien);
    return lien->etat;
}

void lien_envoyer(Lien* lien, const FuriString* ligne) {
    furi_assert(lien);
    furi_assert(ligne);
    if(!lien->fil) return;

    const char* donnees = furi_string_get_cstr(ligne);
    size_t taille = furi_string_size(ligne);

    furi_mutex_acquire(lien->tx_verrou, FuriWaitForever);
    if(lien->canal == LienCanalUsb) {
        /* CDC demande des paquets de 64 octets au plus. */
        size_t envoye = 0;
        while(envoye < taille) {
            size_t bloc = taille - envoye;
            if(bloc > LIEN_USB_PAQUET) bloc = LIEN_USB_PAQUET;
            furi_hal_cdc_send(LIEN_CDC_CANAL, (uint8_t*)donnees + envoye, (uint16_t)bloc);
            envoye += bloc;
        }
    } else if(lien->serie) {
        furi_hal_serial_tx(lien->serie, (const uint8_t*)donnees, taille);
        furi_hal_serial_tx_wait_complete(lien->serie);
    }
    furi_mutex_release(lien->tx_verrou);
}

bool lien_lire(Lien* lien, ProtoTrame* out) {
    furi_assert(lien);
    furi_assert(out);

    FuriString* ligne = NULL;
    if(furi_message_queue_get(lien->lignes, &ligne, 0) != FuriStatusOk) return false;

    bool ok = proto_parser(furi_string_get_cstr(ligne), out);
    if(!ok) FURI_LOG_W(TAG, "trame inconnue: %s", furi_string_get_cstr(ligne));
    furi_string_free(ligne);
    return ok;
}

size_t lien_en_attente(const Lien* lien) {
    furi_assert(lien);
    return furi_message_queue_get_count(lien->lignes);
}
