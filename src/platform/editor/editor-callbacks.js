
///**
// * Overridable callbacks for editor, use `Fire.Engine._editorCallback` to access this module
// * @class _editorCallback
// * @static
// * @private
// */
var editorCallback = {


    onEnginePlayed: null,
    onEngineStopped: null,
    onEnginePaused: null,

    // This will be called before component callbacks
    onEntityCreated: null,

    /**
     * removes an entity and all its children from scene, this method will NOT be called if it is removed by hierarchy.
     * @param {Entity} entity - the entity to remove
     * @param {boolean} isTopMost - indicates whether it is the most top one among the entities who will be deleted in one operation
     */
    onEntityRemoved: null,

    onEntityParentChanged: null,

    /**
     * @param {Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    onEntityIndexChanged: null,

    onEntityRenamed: null,

    /**
     * @param {Scene} scene
     */
    onStartUnloadScene: null,

    /**
     * @param {Scene} scene
     */
    onSceneLaunched: null,

    ///**
    // * @param {Scene} scene
    // */
    //onSceneLoaded: null,

    onComponentEnabled: null,
    onComponentDisabled: null,

    /**
     * @param {Entity} entity
     * @param {Component} component
     */
    onComponentAdded: null,

    /**
     * @param {Entity} entity
     * @param {Component} component
     */
    onComponentRemoved: null
};
