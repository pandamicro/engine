var Scene = (function () {
    var _super = Asset;
    /**
     * @class
     * @extends FIRE.Asset
     * @private
     */ 
    function Scene () {
        _super.call(this);

        /**
         * root entities 
         * @member {FIRE.Entity[]} FIRE.Scene#entities
         */
        this.entities = [];

        /**
         * the active camera
         * @member {FIRE.Camera} FIRE.Scene#camera
         */
        this.camera = null;
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
        this.updateTransform(renderContext);

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

    Scene.prototype.updateTransform = function (renderContext) {
        var entities = this.entities;
        var i;
        var camera = renderContext.camera || this.camera;
        if (camera) {
            // transform by camera
            var mat = new Matrix2x3();
            var camPos = new Vec2();
            camera._calculateTransform(mat, camPos);
            var offsetX = -camPos.x;
            var offsetY = -camPos.y;
            for (i = 0, len = entities.length; i < len; ++i) {
                var pos = entities[i].transform._position;
                var x = pos.x;
                var y = pos.y;
                pos.x += offsetX;
                pos.y += offsetY;
                entities[i].transform._updateTransform(mat);
                pos.x = x;
                pos.y = y;
            }
        }
        else {
            // transform
            for (i = 0, len = entities.length; i < len; ++i) {
                entities[i].transform._updateRootTransform();
            }
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

    Scene.prototype.findEntity = function (path) {
        var nameList = path.split('/');
        var match = null;

        // visit root entities
        var name = nameList[1];     // skip first '/'
        var entities = this.entities;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].isValid && entities[i].name === name) {
                match = entities[i];
                break;
            }
        }
        if (!match) {
            return null;
        }

        // parse path
        var n = 2;                  // skip first '/' and roots
        for (n; n < nameList.length; n++) {
            name = nameList[n];
            // visit sub entities
            var transform = match.transform;
            match = null;
            for (var t = 0, len = transform.childCount; t < len; ++t) {
                var subEntity = transform._children[t].entity;
                if (subEntity.name === name) {
                    match = subEntity;
                    break;
                }
            }
            if (!match) {
                return null;
            }
        }

        return match;
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
