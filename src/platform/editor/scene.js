// editor utils for scene operation

(function () {
    Scene.prototype.createEntity = function (name, flags) {
        var curScene = Engine._scene;   // save
        Engine._scene = this;
        Scene._createWithFlags = flags;
        var ent = new Entity(name);
        Scene._createWithFlags = 0;     // restore
        Engine._scene = curScene;       // restore
        return ent;
    };
})();
