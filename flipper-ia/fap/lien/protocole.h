/**
 * @file protocole.h
 * @brief Encodage / decodage du protocole « Ecaille » (voir docs/PROTOCOLE.md).
 *
 * Une trame tient sur une ligne : TYPE<TAB>cle=valeur<TAB>cle=valeur\n
 * Tout est en ASCII : les polices du Flipper ne savent pas dessiner d'accent.
 */
#pragma once

#include <furi.h>

#define PROTO_VERSION     1
#define PROTO_LIGNE_MAX   512
#define PROTO_CHAMPS_MAX  10
#define PROTO_CLE_MAX     16
#define PROTO_VAL_MAX     200

typedef enum {
    ProtoTypeInconnu = 0,
    ProtoTypeHumeur,
    ProtoTypeDire,
    ProtoTypePropositions,
    ProtoTypeProposition,
    ProtoTypeFiche,
    ProtoTypeExec,
    ProtoTypeErreur,
} ProtoType;

/** Niveau de risque d'une action proposee. */
typedef enum {
    ProtoRisqueSur = 0, /**< rien ne sort de l'appareil */
    ProtoRisqueLocal, /**< ouvre une application */
    ProtoRisqueEmission, /**< emet un signal : confirmation obligatoire */
} ProtoRisque;

/** Verbe d'action execute par le FAP. */
typedef enum {
    ProtoActeRien = 0,
    ProtoActeOuvrirApp,
    ProtoActeFiche,
    ProtoActeNote,
    ProtoActeNotifier,
    ProtoActeInventaire,
} ProtoActe;

typedef struct {
    char cle[PROTO_CLE_MAX];
    char val[PROTO_VAL_MAX];
} ProtoChamp;

typedef struct {
    ProtoType type;
    ProtoChamp champs[PROTO_CHAMPS_MAX];
    size_t nb;
} ProtoTrame;

/**
 * @brief Decoupe une ligne recue en trame.
 * @param ligne  ligne brute, sans le \n final
 * @param out    trame remplie (ecrasee)
 * @return true si le type est reconnu
 */
bool proto_parser(const char* ligne, ProtoTrame* out);

/** @brief Valeur d'un champ, ou @p defaut si absent. */
const char* proto_champ(const ProtoTrame* trame, const char* cle, const char* defaut);

/** @brief Valeur entiere d'un champ, ou @p defaut si absent ou illisible. */
uint32_t proto_champ_u32(const ProtoTrame* trame, const char* cle, uint32_t defaut);

/** @brief Traduit la valeur textuelle d'un champ « risque ». */
ProtoRisque proto_risque(const char* texte);

/** @brief Traduit la valeur textuelle d'un champ « act ». */
ProtoActe proto_acte(const char* texte);

/**
 * @brief Replie une chaine UTF-8 en ASCII imprimable.
 *
 * Les polices u8g2 embarquees (« _tr ») ne couvrent que 0x20..0x7E. Le cerveau
 * desaccentue deja, ceci est la ceinture de securite.
 */
void proto_ascii(char* dst, size_t dst_taille, const char* src);

/**
 * @brief Construit une ligne de protocole.
 *
 * Arguments variadiques : suite de couples (cle, valeur) terminee par NULL.
 * Les valeurs sont echappees et repliees en ASCII. Le \n final est ajoute.
 *
 * @return chaine allouee, a liberer par furi_string_free()
 */
FuriString* proto_construire(const char* type, ...);

/** @brief Ajoute un couple cle=valeur a une ligne deja commencee. */
void proto_ajouter(FuriString* ligne, const char* cle, const char* valeur);

/** @brief Idem avec une valeur entiere. */
void proto_ajouter_u32(FuriString* ligne, const char* cle, uint32_t valeur);
