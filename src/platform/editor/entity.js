// editor utils

(function () {
    
    /**
     * the temp property that indicates the current creating entity should 
     * binded with supplied object flags.
     * 
     * @property {number} Entity._defaultFlags
     * @private
     */
    Entity._defaultFlags = 0;
    
    Entity._createWithFlags = function (name, flags) {
        Entity._defaultFlags = flags;
        var ent = new Entity(name);
        Entity._defaultFlags = 0;
        return ent;
    };

})();
