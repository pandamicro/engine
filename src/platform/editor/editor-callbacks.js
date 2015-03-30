
/**
 * overridable callbacks for editor
 * @property {object} Fire.Engine._editorCallback
 * @private
 */
var editorCallback = {

    onEnginePlayed: null,
    onEngineStopped: null,
    onEnginePaused: null,

    /**
     * This will be called before component callbacks
     * @callback Fire.Engine._editorCallback~onEntityCreated
     * @param {Entity} entity
     */
    /**
     * @property {Engine._editorCallback~onEntityCreated} Fire.Engine._editorCallback.onEntityCreated
     */
    onEntityCreated: null,

    /**
     * removes an entity and all its children from scene, this method will NOT be called if it is removed by hierarchy.
     * @callback Fire.Engine._editorCallback~onEntityRemoved
     * @param {Entity} entity - the entity to remove
     * // @param {boolean} isTopMost - indicates whether it is the most top one among the entities who will be deleted in one operation
     */
    /**
     * @property {Engine._editorCallback~onEntityRemoved} Fire.Engine._editorCallback.onEntityRemoved
     */
    onEntityRemoved: null,

    /**
     * @callback Fire.Engine._editorCallback~onEntityParentChanged
     * @param {Entity} entity
     */
    /**
     * @property {Engine._editorCallback~onEntityParentChanged} Fire.Engine._editorCallback.onEntityParentChanged
     */
    onEntityParentChanged: null,

    /**
     * @callback Fire.Engine._editorCallback~onEntityIndexChanged
     * @param {Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    /**
     * @property {Engine._editorCallback~onEntityIndexChanged} Fire.Engine._editorCallback.onEntityIndexChanged
     */
    onEntityIndexChanged: null,

    /**
     * @callback Fire.Engine._editorCallback~onEntityRenamed
     * @param {Entity} entity
     */
    /**
     * @property {Engine._editorCallback~onEntityRenamed} Fire.Engine._editorCallback.onEntityRenamed
     */
    onEntityRenamed: null,

    /**
     * @callback Fire.Engine._editorCallback~onStartUnloadScene
     * @param {Scene} scene
     */
    /**
     * @property {Engine._editorCallback~onStartUnloadScene} Fire.Engine._editorCallback.onStartUnloadScene
     */
    onStartUnloadScene: null,

    /**
     * @callback Fire.Engine._editorCallback~onSceneLaunched
     * @param {Scene} scene
     */
    /**
     * @property {Engine._editorCallback~onSceneLaunched} Fire.Engine._editorCallback.onSceneLaunched
     */
    onSceneLaunched: null,

    ///**
    // * @callback Fire.Engine._editorCallback~onSceneLoaded
    // * @param {Scene} scene
    // */
    ///**
    // * @property {Engine._editorCallback~onSceneLoaded} Fire.Engine._editorCallback.onSceneLoaded
    // */
    //onSceneLoaded: null,

    /**
     * @callback Fire.Engine._editorCallback~onComponentEnabled
     * @param {Component} component
     */
    /**
     * @property {Engine._editorCallback~onComponentEnabled} Fire.Engine._editorCallback.onComponentEnabled
     */
    onComponentEnabled: null,

    /**
     * @callback Fire.Engine._editorCallback~onComponentDisabled
     * @param {Component} component
     */
    /**
     * @property {Engine._editorCallback~onComponentDisabled} Fire.Engine._editorCallback.onComponentDisabled
     */
    onComponentDisabled: null,

    /**
     * @callback Fire.Engine._editorCallback~onComponentAdded
     * @param {Entity} entity
     * @param {Component} component
     */
    /**
     * @property {Engine._editorCallback~onComponentAdded} Fire.Engine._editorCallback.onComponentAdded
     */
    onComponentAdded: null,

    /**
     * @callback Fire.Engine._editorCallback~onComponentRemoved
     * @param {Entity} entity
     * @param {Component} component
     */
    /**
     * @property {Engine._editorCallback~onComponentRemoved} Fire.Engine._editorCallback.onComponentRemoved
     */
    onComponentRemoved: null
};
