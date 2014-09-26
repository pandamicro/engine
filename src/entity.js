var Entity = (function () {
    var _super = HashObject;

    // constructor
    function Entity (name) {
        _super.call(this);

        this._active = true;

        this.name = typeof name !== 'undefined' ? name : "New Entity";

        this._objFlags |= Entity._createWithFlags;

        if (FIRE._isDeserializing) {
            // create by deserializer
            this._components = null;
            this.transform = null;
        }
        else {
            // create dynamically
            
            // 绕开AddComponent直接添加Transfrom，因此transform的onLoad不会被调用，
            var transform = new Transform();
            transform.entity = this;
            
            this._components = [transform];
            this.transform = transform;

            // Transform比较特殊，需要二次构造
            // 因为它构造的时候依赖于entity，所以要在entity赋值后再初始化一次，
            // 这里不把entity做为构造参数主要是为了和其它Component统一。
            // create和onLoad不同，onLoad只有添加到场景后并且entity第一次激活才会调用。
            transform.create();
        }
    }
    FIRE.extend(Entity, _super);
    FIRE.registerClass("FIRE.Entity", Entity);

    ////////////////////////////////////////////////////////////////////
    // static
    ////////////////////////////////////////////////////////////////////

    /**
     * Finds an entity by hierarchy path, the path is case-sensitive, and must start with a '/' character.
     * It will traverse the hierarchy by splitting the path using '/' character.
     * It is recommended to not use this function every frame instead cache the result at startup.
     * @method FIRE.Entity.find
     * @param {string} path
     * @return {FIRE.Entity} the entity or null if not found
     */
    Entity.find = function (path) {
        if (!path && path !== '') {
            console.error('Argument must be non-nil');
            return;
        }
        if (path[0] !== '/') {
            console.error("Path must start with a '/' character");
            return;
        }
        return Engine._scene.findEntity(path);
    };

    ////////////////////////////////////////////////////////////////////
    // properties
    ////////////////////////////////////////////////////////////////////
    
    Object.defineProperty(Entity.prototype, 'active', {
        get: function () {
            return this._active;
        },
        set: function (value) {
            // jshint eqeqeq: false
            if (this._active != value) {
                // jshint eqeqeq: true
                this._active = value;
                var canActiveInHierarchy = (!this.transform.parent || this.transform.parent.entity.activeInHierarchy);
                if (canActiveInHierarchy) {
                    this._onActivatedInHierarchy(value);
                }
            }
        }
    });

    Object.defineProperty(Entity.prototype, 'activeInHierarchy', {
        get: function () {
            return this._active && (!this.transform.parent || this.transform.parent.entity.activeInHierarchy);
        },
    });

    // overrides
    
    Entity.prototype.destroy = function () {
        if (_super.prototype.destroy.call(this)) {
            // disable hierarchy
            if (this.activeInHierarchy) {
                this._onActivatedInHierarchy(false);
            }
        }
    };

    Entity.prototype._onPreDestroy = function () {
        this._objFlags |= Destroying;
        // destroy components
        for (var c = 0; c < this._components.length; ++c) {
            var component = this._components[c];
            component._destroyImmediate();
        }
    };

    // other functions

    Entity.prototype.addComponent = function (constructor) {
        if (this._objFlags & Destroying) {
            console.error('isDestroying');
            return;
        }
        if (!constructor) {
            console.error('Argument must be non-nil');
            return;
        }
        if (typeof constructor !== 'function') {
            console.error("The component to add must be a constructor");
            return;
        }
        var component = new constructor();
        component.entity = this;
        this._components.push(component);
        
        if (this.activeInHierarchy) {
            // call onLoad/onEnable
            component._onEntityActivated(true);
        }
        return component;
    };

    Entity.prototype.getComponent = function (constructor) {
        if (!constructor) {
            console.error('Argument must be non-nil');
            return;
        }
        for (var c = 0; c < this._components.length; ++c) {
            var component = this._components[c];
            if (component instanceof constructor) { // TODO: what if multi javascript context?
                return component;
            }
        }
        return null;
    };

    Entity.prototype._removeComponent = function (component) {
        /*if (!component) {
            console.error('Argument must be non-nil');
            return;
        }*/
        if (!(this._objFlags & Destroying)) {
            //if (component.onHierarchyChanged) {
            //    this.transform._removeListener(component);
            //}
            var i = this._components.indexOf(component);
            if (i !== -1) {
                this._components.splice(i, 1);
                component.entity = null;
            }
            else if (component.entity !== this) {
                console.error("Component not owned by this entity");
            }
        }
    };

    Entity.prototype._onActivatedInHierarchy = function (value) {
        var self = this;
        // 当引入DestroyImmediate后，_components的元素有可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
        // var components = self._components.slice();
        
        // component有可能在onEnable时增加，而新增的component已经onEnable了，所以这里事先记下长度，以免重复调用
        var countBefore = self._components.length;
        for (var c = 0; c < countBefore; ++c) {
            var component = self._components[c];
            component._onEntityActivated(value);
        }
        // activate children recursively
        var transform = self.transform;
        for (var i = 0, len = transform.childCount; i < len; ++i) {
            var entity = transform._children[i].entity;
            if (entity._active) {
                entity._onActivatedInHierarchy(value);
            }
        }
    };
    
    Entity.prototype._onHierarchyChanged = function (oldParent) {
        var self = this;
        var activeInHierarchyBefore = self._active && (!oldParent || oldParent.activeInHierarchy);
        var activeInHierarchyNow = self.activeInHierarchy;
        if (activeInHierarchyBefore !== activeInHierarchyNow) {
            self._onActivatedInHierarchy(activeInHierarchyNow);
        }
    };



    return Entity;
})();

FIRE.Entity = Entity;
