﻿var Entity = (function () {
    var _super = FIRE.FObject;

    // constructor
    function Entity (name) {
        _super.call(this);
        init(this, name);
    }
    FIRE.extend(Entity, _super);
    Entity.prototype.__classname__ = "FIRE.Entity";

    // init
    var init = function (self, name) {
        self._active = true;
        self._components = [];

        self.name = name || "Entity";
        self.transform = new Transform();
        self.addComponent(self.transform);
    };

    // properties
    Entity.prototype.__defineGetter__('active', function () { return this._active; });
    Entity.prototype.__defineSetter__('active', function (value) {
        // jshint eqeqeq: false
        if (this._active != value) {
        // jshint eqeqeq: true
            this._active = value;
            var canActiveInHierarchy = (!this.transform.parent || this.transform.parent.entity.activeInHierarchy);
            if (canActiveInHierarchy) {
                _onActivatedInHierarchy(this, value);
            }
        }
    });
    Entity.prototype.__defineGetter__('activeInHierarchy', function () {
        // TODO: use while to avoid function call
        return this._active && (!this.transform.parent || this.transform.parent.entity.activeInHierarchy);
    });

    // overrides
    
    Entity.prototype.destroy = function () {
        if (_super.prototype.destroy.call(this)) {
            // disable hierarchy
            if (this.activeInHierarchy) {
                _onActivatedInHierarchy(this, false);
            }
        }
    };

    Entity.prototype._onPreDestroy = function () {
        this.isDestroying = true;
        // destroy components
        for (var c = 0; c < this._components.length; ++c) {
            var component = this._components[c];
            component._destroyImmediate();
        }
    };

    // other functions

    Entity.prototype.addComponent = function (component) {
        if (this.isDestroying) {
            console.error('isDestroying');
            return;
        }
        if (!component) {
            console.error('Argument must be non-nil');
            return;
        }
        if (component.entity) {
            console.error("Component already added. It can't be added again");
            return;
        }
        component.entity = this;
        this._components.push(component);
        
        // call onInit
        if (component.onCreate) {
            component.onCreate();
        }

        // call onEnable
        if (this.activeInHierarchy) {
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
        if (!this.isDestroying) {
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

    var _onActivatedInHierarchy = function (self, value) {
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
                _onActivatedInHierarchy(entity, value);
            }
        }
    };
    
    Entity.prototype._onHierarchyChanged = function (oldParent) {
        var self = this;
        var activeInHierarchyBefore = self._active && (!oldParent || oldParent.activeInHierarchy);
        var activeInHierarchyNow = self.activeInHierarchy;
        if (activeInHierarchyBefore !== activeInHierarchyNow) {
            _onActivatedInHierarchy(self, activeInHierarchyNow);
        }
    };



    return Entity;
})();

FIRE.Entity = Entity;
