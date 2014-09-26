
// definitions for FObject._objFlags

var _objFlagIndex = Fire._ObjFlagIndex.Engine;
var SceneGizmo = (1 << _objFlagIndex++)/* | Fire._ObjectFlags.DontSave*/;
var Destroying = (1 << _objFlagIndex++);

/**
 * This flag is readonly, it can only be used as the argument of scene.createEntity().
 * @property {number} Fire._ObjectFlags.SceneGizmo
 */
Fire._ObjectFlags.SceneGizmo = SceneGizmo;

Fire._ObjectFlags.Destroying = Destroying;
