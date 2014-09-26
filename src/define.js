
// definitions for FObject._objFlags

var _objFlagIndex = FIRE._ObjFlagIndex.Engine;
var SceneGizmo = (1 << _objFlagIndex++)/* | FIRE._ObjectFlags.DontSave*/;
var Destroying = (1 << _objFlagIndex++);

/**
 * This flag is readonly, it can only be used as the argument of scene.createEntity().
 * @property {number} FIRE._ObjectFlags.SceneGizmo
 */
FIRE._ObjectFlags.SceneGizmo = SceneGizmo;

FIRE._ObjectFlags.Destroying = Destroying;
