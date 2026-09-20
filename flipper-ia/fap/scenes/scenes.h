/**
 * @file scenes.h
 * @brief Declaration des scenes via le schema habituel du firmware.
 */
#pragma once

#include <gui/scene_manager.h>

#define ADD_SCENE(prefix, name, id) DauphinScene##id,
typedef enum {
#include "scenes_config.h"
    DauphinSceneNb,
} DauphinScene;
#undef ADD_SCENE

extern const SceneManagerHandlers dauphin_scene_handlers;

#define ADD_SCENE(prefix, name, id)                                            \
    void prefix##_scene_##name##_on_enter(void* contexte);                     \
    bool prefix##_scene_##name##_on_event(void* contexte, SceneManagerEvent e); \
    void prefix##_scene_##name##_on_exit(void* contexte);
#include "scenes_config.h"
#undef ADD_SCENE
