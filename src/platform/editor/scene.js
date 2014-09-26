// editor utils for scene operation

(function () {
    Scene.prototype.createEntity = function (name, flags) {
        var isCurrentScene = Engine._scene === this;
        if (isCurrentScene === false) {
            Engine._canModifyCurrentScene = false;
            Engine._scene = this;
        }

        var ent = Entity._createWithFlags(name, flags);
        
        if (isCurrentScene === false) {
            Engine._canModifyCurrentScene = true;
        }
        return ent;
    };
})();
