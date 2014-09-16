var Scene = (function () {
    var _super = Asset;
    /**
     * @class
     * @extends FIRE.Asset
     * @private
     */ 
    function Scene () {
        _super.call(this);

        /** @member {FIRE.Entity[]} - root entities */
        this.entities = [];
    }
    FIRE.extend(Scene, _super);
    FIRE.registerClass("FIRE.Scene", Scene);

    ////////////////////////////////////////////////////////////////////
    // visit functions
    ////////////////////////////////////////////////////////////////////

    // 当引入DestroyImmediate后，entity和component可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
    var visitFunctionTmpl = '(function (entity) {\
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
                _FUNC_NAME_Recursively(subEntity);\
            }\
        }\
    })';

    // jshint evil: true
    var updateRecursively = eval(visitFunctionTmpl.replace(/_FUNC_NAME_/g, 'update'));
    var onPreRenderRecursively = eval(visitFunctionTmpl.replace(/_FUNC_NAME_/g, 'onPreRender'));
    // jshint evil: false
    
    Scene.prototype.update = function () {
        // call update
        var self = this;
        var entities = self.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            updateRecursively(entities[i]);
        }
    };

    Scene.prototype.render = function (renderContext) {
        // updateTransform
        this.updateTransform();
        // call onPreRender
        var self = this;
        var entities = self.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            onPreRenderRecursively(entities[i]);
        }
        // render
        renderContext.render();
    };

    // other functions

    Scene.prototype.updateTransform = function () {
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            entities[i].transform._updateRootTransform();
        }
    };

    Scene.prototype.appendRoot = function (_entity) {
        this.entities.push(_entity);
    };

    Scene.prototype.removeRoot = function (_entity) {
        // TODO: performence test
        var entities = this.entities;
        if (entities.length > 0 && entities[entities.length - 1] === _entity) {
            entities.pop();
            return;
        }
        var index = entities.indexOf(_entity);
        if (index !== -1) {
            entities.splice(index, 1);
        }
        else {
            console.error('entity ' + _entity + ' not contains in roots of hierarchy');
        }
    };

    Scene.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        var entities = this.entities;
        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];
            if (entity.isValid) {
                entity.destroy();
            }
        }
    };

    return Scene;
})();

FIRE._Scene = Scene;
