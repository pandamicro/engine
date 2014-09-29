
// definitions for editor

(function () {
    // pre-declaration for unit tests, overridable for editor
    Fire.broadcast = function () {};

    editorCallback.onSceneLaunched = function (scene) {
        Fire.broadcast('scene:launched', scene);
    };
    editorCallback.onSceneLoaded = function (scene) {
        Fire.broadcast('scene:loaded', scene);
    };
    var onTransformCreated = 'transform:created';
    editorCallback.onTransformCreated = function (transform) {
        Fire.broadcast(onTransformCreated, transform);
    };
    var onTransformRemoved = 'transform:removed';
    editorCallback.onTransformRemoved = function (transform) {
        Fire.broadcast(onTransformRemoved, transform);
    };
    var onTransformParentChanged = 'transform:parentChanged';
    editorCallback.onTransformParentChanged = function (transform, oldParent) {
        Fire.broadcast(onTransformParentChanged, transform, oldParent);
    };
    var onTransformIndexChanged = 'transform:indexChanged';
    editorCallback.onTransformIndexChanged = function (transform, oldIndex, newIndex) {
        Fire.broadcast(onTransformIndexChanged, transform, oldIndex, newIndex);
    };
})();
