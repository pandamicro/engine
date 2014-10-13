
// This adapter converts editor callbacks to ipc events

(function () {

    // pre-declaration for unit tests, overridable for editor
    Fire.broadcast = function () {};

    editorCallback.onSceneLaunched = function (scene) {
        Fire.broadcast('scene:launched');
    };
    //editorCallback.onSceneLoaded = function (scene) {
    //    Fire.broadcast('scene:loaded', scene.entities);
    //};

    var onEntityCreated = 'entity:created';
    editorCallback.onEntityCreated = function (entity) {
        Fire.broadcast( onEntityCreated,
                        entity._name,
                        entity._objFlags,
                        entity.hashKey//,
                        //entity.transform.parent && entity.transform.parent.entity.hashKey
                      );
    };

    var onEntityRemoved = 'entity:removed';
    editorCallback.onEntityRemoved = function (entity) {
        Fire.broadcast( onEntityRemoved, entity.hashKey );
    };

    var onEntityParentChanged = 'entity:parentChanged';
    editorCallback.onEntityParentChanged = function (entity) {
        Fire.broadcast( onEntityParentChanged,
                        entity.hashKey,
                        entity.transform.parent && entity.transform.parent.entity.hashKey
                      );
    };

    var onEntityIndexChanged = 'entity:indexChanged';
    editorCallback.onEntityIndexChanged = function (entity, oldIndex, newIndex) {
        // get next sibling in game
        var next = null;
        var i = newIndex;
        do {
            ++i;
            var nextTrans = entity.transform.getSibling(i);
            next = nextTrans && nextTrans.entity;
        } while (next && (next._objFlags & SceneGizmo));
        //
        Fire.broadcast( onEntityIndexChanged,
                        entity.hashKey,
                        next && next.hashKey
                      );
    };

    editorCallback.onEntityRenamed = function (entity) {
        Fire.broadcast('entity:renamed',
                        entity.hashKey,
                        entity._name
                      );
    };

})();
