var Transform = (function () {
    var _super = Component;

    // constructor
    function Transform () {
        _super.call(this);
        init(this);
    }
    FIRE.extend(Transform, _super);
    Transform.prototype.__classname__ = "FIRE.Transform";

    // init
    var init = function (self) {
        self._parent = null;
        self._children = [];
        self._position = new FIRE.Vec2(0, 0);
    };

    // properties

    Transform.prototype.__defineGetter__('parent', function () { return this._parent; });
    Transform.prototype.__defineSetter__('parent', function (value) {
        // jshint eqeqeq: false
        if (this._parent != value) {
        // jshint eqeqeq: true
            if (value && value instanceof Transform === false) {
                console.error('Parent must be a Transform or null');
                return;
            }
            var oldParent = this._parent;
            this._parent = value;
            if (value) {
                if (!oldParent) {
                    Engine._scene.removeRoot(this.entity);
                }
                value._children.push(this);
            }
            else {
                Engine._scene.appendRoot(this.entity);
            }
            if (oldParent && !oldParent.entity.isDestroying) {
                oldParent._children.splice(oldParent._children.indexOf(this), 1);
                this.entity._onHierarchyChanged(oldParent);
            }
        }
    });

    Transform.prototype.__defineGetter__('childCount', function () {
        return this._children.length;
    });

    Transform.prototype.__defineGetter__('position', function () { return this._position; });
    Transform.prototype.__defineSetter__('position', function (value) {
        this._position = value;
    });

    // built-in functions

    Transform.prototype.onCreate = function () {
        Engine._scene.appendRoot(this.entity);
    }

    Transform.prototype.onDestroy = function () {
        if (this._parent) {
            this.parent = null; // TODO: may call onEnable on other component's
        }
        else {
            Engine._scene.removeRoot(this.entity);
        }
        // destroy child entitys
        var children = this._children;
        for (var i = 0, len = children.length; i < len; ++i) {
            var entity = children[i].entity;
            entity._destroyImmediate();
        }
    };

    Transform.prototype.destroy = function () {
        console.error("Not allowed to destroy the transform. Please destroy the entity instead.");
        return;
    };
    
    // other functions

    Transform.prototype.getChild = function (index) {
        return this._children[index];
    };

    return Transform;
})();

FIRE.Transform = Transform;
