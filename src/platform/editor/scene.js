// editor utils for scene operation

(function () {
    Scene.prototype.createEntity = function (name, flags) {
        // push
        Engine._canModifyCurrentScene = false;
        Engine._scene = this;
        Scene._createWithFlags = flags;
        // create
        var ent = new Entity(name);
        // pop
        Scene._createWithFlags = 0;
        Engine._canModifyCurrentScene = true;
        return ent;
    };
})();
