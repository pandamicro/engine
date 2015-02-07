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
    Fire.setClassName("Fire.Scene", Scene);

    ////////////////////////////////////////////////////////////////////
    // static
    ////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////
    // traversal operations
    ////////////////////////////////////////////////////////////////////

    // 当引入DestroyImmediate后，entity和component可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
    var visitFunctionTmpl = "\
(function(e){\
	var len=e._components.length;\
	for(var c=0;c<len;++c){\
		var c=e._components[c];\
		if(c._enabled && c._FUNC_) c._FUNC_();\
	}\
	var cs=e._children;\
	for(var i=0,len=cs.length;i<len;++i){\
		var sub=cs[i];\
		if(sub._active) _FUNC_Recursively(sub);\
	}\
})";

    // jshint evil: true
    var updateRecursively = eval(visitFunctionTmpl.replace(/_FUNC_/g, 'update'));
    var lateUpdateRecursively = eval(visitFunctionTmpl.replace(/_FUNC_/g, 'lateUpdate'));
    var onPreRenderRecursively = eval(visitFunctionTmpl.replace(/_FUNC_/g, 'onPreRender'));
    // jshint evil: false

    Scene.prototype.update = function () {
        // call update
        var entities = this.entities;
        var i = 0, len = entities.length;
        // invoke onStart
        // TODO: 使用一个数组将需要调用的 onStart 存起来，避免递归遍历
        for (; i < len; ++i) {
            Component._invokeStarts(entities[i]);
        }
        // invoke update
        for (i = 0, len = entities.length; i < len; ++i) {
            updateRecursively(entities[i]);
        }
        // invoke lateUpdate
        for (i = 0, len = entities.length; i < len; ++i) {
            lateUpdateRecursively(entities[i]);
        }
    };

    Scene.prototype.render = function (renderContext) {
        Engine._curRenderContext = renderContext;

        // updateTransform
        this.updateTransform(renderContext.camera || this.camera);

        // call onPreRender
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            onPreRenderRecursively(entities[i]);
        }

        // render
        renderContext.render();

        Engine._curRenderContext = null;
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

    Scene.prototype.activate = function () {
        // active entities, invoke onLoad and onEnable
        var entities = this.entities;
        var i = 0, len = entities.length;
        for (; i < len; ++i) {
            var entity = entities[i];
            if (entity._active) {
                entity._onActivatedInHierarchy(true);
            }
        }
        if (Engine.isPlaying) {
            // invoke onStart
            for (i = 0, len = entities.length; i < len; ++i) {
                Component._invokeStarts(entities[i]);
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

    Scene.prototype._instantiate = function () {
        var uuid = this._uuid;
        var result = Fire._doInstantiate(this);
        result._uuid = uuid;
        return result;
    };

    return Scene;
})();

Fire._Scene = Scene;
