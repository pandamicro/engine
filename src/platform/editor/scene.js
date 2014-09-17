// editor utils for scene operation

(function () {
    Scene.prototype.createEntity = function (name) {
        var curScene = Engine._scene;   // save
        Engine._scene = this;
        var ent = new Entity(name);
        Engine._scene = curScene;       // restore
        return ent;
    };
})();
