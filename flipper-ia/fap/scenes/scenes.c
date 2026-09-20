#include "scenes.h"

#define ADD_SCENE(prefix, name, id) prefix##_scene_##name##_on_enter,
static void (*const dauphin_scene_on_enter_handlers[])(void*) = {
#include "scenes_config.h"
};
#undef ADD_SCENE

#define ADD_SCENE(prefix, name, id) prefix##_scene_##name##_on_event,
static bool (*const dauphin_scene_on_event_handlers[])(void*, SceneManagerEvent) = {
#include "scenes_config.h"
};
#undef ADD_SCENE

#define ADD_SCENE(prefix, name, id) prefix##_scene_##name##_on_exit,
static void (*const dauphin_scene_on_exit_handlers[])(void*) = {
#include "scenes_config.h"
};
#undef ADD_SCENE

const SceneManagerHandlers dauphin_scene_handlers = {
    .on_enter_handlers = dauphin_scene_on_enter_handlers,
    .on_event_handlers = dauphin_scene_on_event_handlers,
    .on_exit_handlers = dauphin_scene_on_exit_handlers,
    .scene_num = DauphinSceneNb,
};
