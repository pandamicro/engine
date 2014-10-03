
// definitions for FObject._objFlags

var _objFlagIndex = Fire._ObjFlagIndex.Engine;
var SceneGizmo = (1 << _objFlagIndex++)/* | Fire._ObjectFlags.DontSave*/;
var Destroying = (1 << _objFlagIndex++);

/**
 * This flag is readonly, it can only be used as the argument of scene.createEntity() or Entity.createWithFlags()
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
     * @callback Fire.Engine._editorCallback~onEntityCreated
     * @param {Fire.Transform} transform
     */
    /**
     * @property {Fire.Engine._editorCallback~onEntityCreated} Fire.Engine._editorCallback.onEntityCreated
     */
    onEntityCreated: null,

    /**
     * removes a transform and all its children from scene
     * @callback Fire.Engine._editorCallback~onEntityRemoved
     * @param {Fire.Transform} transform
     */
    /**
     * @property {Fire.Engine._editorCallback~onEntityRemoved} Fire.Engine._editorCallback.onEntityRemoved
     */
    onEntityRemoved: null,

    /**
     * @callback Fire.Engine._editorCallback~onEntityParentChanged
     * @param {Fire.Transform} transform
     */
    /**
     * @property {Fire.Engine._editorCallback~onEntityParentChanged} Fire.Engine._editorCallback.onEntityParentChanged
     */
    onEntityParentChanged: null,
    /**
     * @callback Fire.Engine._editorCallback~onEntityIndexChanged
     * @param {Fire.Transform} transform
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    /**
     * @property {Fire.Engine._editorCallback~onEntityIndexChanged} Fire.Engine._editorCallback.onEntityIndexChanged
     */
    onEntityIndexChanged: null,

    /**
     * @callback Fire.Engine._editorCallback~onSceneLaunched
     * @param {Scene} scene
     */
    /**
     * @property {Fire.Engine._editorCallback~onSceneLaunched} Fire.Engine._editorCallback.onSceneLaunched
     */
    onSceneLaunched: null,

    /**
     * @callback Fire.Engine._editorCallback~onSceneLoaded
     * @param {Scene} scene
     */
    /**
     * @property {Fire.Engine._editorCallback~onSceneLoaded} Fire.Engine._editorCallback.onSceneLoaded
     */
    onSceneLoaded: null,
};
