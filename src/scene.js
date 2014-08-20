var Scene = (function () {
    var _super = FIRE.Asset;

    // constructor
    function Scene () {
        _super.call(this);
        init(this);
    }
    FIRE.extend(Scene, _super);
    Scene.prototype.__classname__ = "FIRE.Scene";

    // init
    var init = function (self) {
        self.entities = [];     // root entities
    };

    // visit functions

    // 当引入DestroyImmediate后，entity和component可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
    var visitFunctionTmpl = 'var _FUNC_NAME_Recursively = function (entity) {\
        var countBefore = entity._components.length;\
        for (var c = 0; c < countBefore; ++c) {\
            var component = entity._components[c];\
            if (component._enabled && component._FUNC_NAME_) {\
                component._FUNC_NAME_();\
            }\
        }\
        var transform = entity.transform;\
        for (var i = 0, len = transform.childCount; i < len; ++i) {\
            var subEntity = transform._children[i].entity;\
            if (subEntity._active) {\
                call_FUNC_NAME_Recursively(subEntity);\
            }\
        }\
    }';

    // declare updateRecursively method in eval
    // jshint evil: true
    eval(visitFunctionTmpl.replace(/_FUNC_NAME_/g, 'update'));
    // jshint evil: false
    /* global updateRecursively: false */

    // other functions
    
    // visit entities and components
    Scene.prototype.update = function () {
        var self = this;
        var entities = self.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            updateRecursively(entities[i]);
        }
    };

    Scene.prototype.render = function (renderContext) {
        
    };

    return Scene;
})();

FIRE.Scene = Scene;
