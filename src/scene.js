var Scene = (function () {
    var _super = Asset;
    /**
     * @class
     * @extends Fire.Asset
     * @private
     */ 
    function Scene () {
        _super.call(this);

        /**
         * root entities 
         * @member {Fire.Entity[]} Fire.Scene#entities
         */
        this.entities = [];

        /**
         * the active camera
         * @member {Fire.Camera} Fire.Scene#camera
         */
        this.camera = null;
    }
    Fire.extend(Scene, _super);
    Fire.registerClass("Fire.Scene", Scene);

    ////////////////////////////////////////////////////////////////////
    // static
    ////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////
    // traversal operations
    ////////////////////////////////////////////////////////////////////

    // 当引入DestroyImmediate后，entity和component可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
    var visitFunctionTmpl = '\
(function (entity) {\n\
    var countBefore = entity._components.length;\n\
    for (var c = 0; c < countBefore; ++c) {\n\
        var component = entity._components[c];\n\
        if (component._enabled && component._FUNC_NAME_) {\n\
            component._FUNC_NAME_();\n\
        }\n\
    }\n\
    var children = entity._children;\n\
    for (var i = 0, len = children.length; i < len; ++i) {\n\
        var subEntity = children[i];\n\
        if (subEntity._active) {\n\
            _FUNC_NAME_Recursively(subEntity);\n\
        }\n\
    }\n\
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
        Engine._curRenderContext = renderContext;

        // updateTransform
        this.updateTransform(renderContext.camera || this.camera);

        // call onPreRender
        var self = this;
        var entities = self.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            onPreRenderRecursively(entities[i]);
        }

        // render
        renderContext.render();

        Engine._curRenderContext = null;
    };

    function _updateInteractionContextRecursilvey ( entity, interactionContext ) {
        for ( var c = 0; c < entity._components.length; ++c ) {
            var component = entity._components[c];
            if ( component instanceof Fire.Renderer ) { 
                var obb = component.getWorldOrientedBounds();
                var aabb = new Rect();
                Math.calculateMaxRect(aabb, obb[0], obb[1], obb[2], obb[3]);
                interactionContext.add( entity, aabb, obb );
                break;
            }
        }

        for ( var i = 0, len = entity._children.length; i < len; ++i ) {
            var childEnt = entity._children[i];
            _updateInteractionContextRecursilvey(childEnt, interactionContext);
        }
    }

    Scene.prototype.updateInteractionContext = function (interactionContext) {
        // clear intersection data
        interactionContext.clear();

        // recursively process each entity
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            _updateInteractionContextRecursilvey( entities[i], interactionContext );
        }
    };

    ////////////////////////////////////////////////////////////////////
    // other functions
    ////////////////////////////////////////////////////////////////////

    Scene.prototype.updateTransform = function (camera) {
        var entities = this.entities;
        var i, len;
        if (camera) {
            // transform by camera
            var mat = new Matrix23();
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
            Fire.error('entity ' + _entity + ' not contains in roots of hierarchy');
        }
    };

    Scene.prototype.findEntity = function (path) {
        var nameList = path.split('/');
        var match = null;

        // visit root entities
        var name = nameList[1];     // skip first '/'
        var entities = this.entities;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].isValid && entities[i]._name === name) {
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
            var children = match._children;
            match = null;
            for (var t = 0, len = children.length; t < len; ++t) {
                var subEntity = children[t];
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

    Scene.prototype.onLaunch = function () {
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            var entity = entities[i];
            if (entity._active) {
                entity._onActivatedInHierarchy(true);
            }
        }
    };

    Scene.prototype.destroy = function () {
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            var entity = entities[i];
            if (entity.isValid) {
                entity.destroy();
            }
        }
        _super.prototype.destroy.call(this);
    };

    //Scene.prototype.onReady = function () {
    //};

    return Scene;
})();

Fire._Scene = Scene;
