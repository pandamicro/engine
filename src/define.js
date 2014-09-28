
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

//

/**
 * overridable callbacks for editor
 * @property {object} Fire.Engine._editorCallback
 * @private
 */
var editorCallback = {
    /**
     * @property {Fire.Engine._editorCallback~onTransformCreated} Fire.Engine._editorCallback.onTransformCreated
     */
    onTransformCreated: null,
    /**
     * @property {Fire.Engine._editorCallback~onTransformRemoved} Fire.Engine._editorCallback.onTransformRemoved
     */
    onTransformRemoved: null,
    /**
     * @property {Fire.Engine._editorCallback~onTransformParentChanged} Fire.Engine._editorCallback.onTransformParentChanged
     */
    onTransformParentChanged: null,
    /**
     * @property {Fire.Engine._editorCallback~onTransformIndexChanged} Fire.Engine._editorCallback.onTransformIndexChanged
     */
    onTransformIndexChanged: null,
    /**
     * @property {Fire.Engine._editorCallback~onSceneLaunched} Fire.Engine._editorCallback.onSceneLaunched
     */
    onSceneLaunched: null,
    /**
     * @property {Fire.Engine._editorCallback~onSceneLoaded} Fire.Engine._editorCallback.onSceneLoaded
     */
    onSceneLoaded: null,
};
/**
 * @callback Fire.Engine._editorCallback~onTransformCreated
 * @param {Fire.Transform} transform
 */
/**
 * removes a transform and all its children from scene
 * @callback Fire.Engine._editorCallback~onTransformRemoved
 * @param {Fire.Transform} transform
 */
/**
 * @callback Fire.Engine._editorCallback~onTransformParentChanged
 * @param {Fire.Transform} transform
 * @param {Fire.Transform} oldParent
 */
/**
 * @callback Fire.Engine._editorCallback~onTransformIndexChanged
 * @param {Fire.Transform} transform
 * @param {number} newIndex
 * @param {number} oldIndex
 */
/**
 * @callback Fire.Engine._editorCallback~onSceneLaunched
 * @param {Scene} scene
 */
/**
 * @callback Fire.Engine._editorCallback~onSceneLoaded
 * @param {Scene} scene
 */
