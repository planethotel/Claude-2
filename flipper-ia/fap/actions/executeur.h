/**
 * @file executeur.h
 * @brief Execution des actions proposees par le cerveau.
 *
 * Le cerveau ne commande jamais le materiel directement : il propose un verbe,
 * le FAP decide s'il l'execute et comment. Les actions qui emettent passent
 * toujours par la scene de confirmation avant d'arriver ici.
 */
#pragma once

#include "../dauphin_ia_i.h"

/**
 * @brief Execute la proposition d'indice @p indice.
 * @param rendu  rempli avec une phrase courte decrivant le resultat
 * @return true si l'action a abouti
 */
bool executeur_lancer(DauphinIa* app, size_t indice, FuriString* rendu);
