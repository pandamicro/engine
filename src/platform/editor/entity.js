// editor utils

(function () {
    
    Entity.createWithFlags = function (name, flags) {
        Entity._defaultFlags = flags;
        var ent = new Entity(name);
        Entity._defaultFlags = 0;
        return ent;
    };

})();
