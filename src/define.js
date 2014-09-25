
// definitions for FObject._objFlags

var _objFlagIndex = FIRE._ObjFlagIndex.Engine;
var SceneGizmo = (1 << _objFlagIndex++)/* | FIRE.ObjectFlags.DontSave*/;
var Destroying = (1 << _objFlagIndex++);

/**
 * This flag is readonly, it can only be used as the argument of scene.createEntity().
 * @property {number} FIRE.ObjectFlags.SceneGizmo
 */
FIRE.ObjectFlags.SceneGizmo = SceneGizmo;

FIRE.ObjectFlags.Destroying = Destroying;
