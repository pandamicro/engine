FIRE.Entity = (function () {
    var _super = FIRE.FObject;

    // constructor
    function Entity () {
        _super.call(this);
        init(this);
    }
    FIRE.extend(Entity, _super);
    Entity.prototype.__classname__ = "FIRE.Entity";

    // init
    var init = function (self) {
        self._active = true;
        self._components = [];

        self.name = "Entity";
        self.transform = new FIRE.Transform();
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
        return this._active && (!this.transform.parent || this.transform.parent.entity.activeInHierarchy);
    });

    // functions

    Entity.prototype.addComponent = function (component) {
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
        
        if (this.activeInHierarchy) {
            component._onEntityActivated(true);
        }
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
        var i = this._components.indexOf(component);
        if (i !== -1) {
            this._components.splice(i, 1);
            component.entity = null;
        }
        else if (component.entity !== this) {
            console.error("Component not owned by this entity");
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
