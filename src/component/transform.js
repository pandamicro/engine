var Transform = (function () {
    var _super = Component;

    /**
     * @class
     * @alias FIRE.Transform
     * @extends FIRE.Component
     */ 
    function Transform () {
        _super.call(this);

        this._parent = null;
        this._children = [];

        this._position = new Vec2(0, 0);
        this._rotation = 0;
        this._scale = new Vec2(1, 1);

        this._worldTransform = new Matrix3();
    }
    FIRE.extend("FIRE.Transform", Transform, _super);

    // properties

    /**
     * The parent of the transform.
     * Changing the parent will keep the local space position, rotation and scale the same but modify the world space position, scale and rotation.
     * @member {FIRE.Transform} FIRE.Transform#parent
     */
    Transform.prototype.__defineGetter__('parent', function () { return this._parent; });
    Transform.prototype.__defineSetter__('parent', function (value) {
        // jshint eqeqeq: false
        if (this._parent != value) {
        // jshint eqeqeq: true
            if (value === this) {
			    console.warn("A transform can't be set as the parent of itself.");
			    return;
            }
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

    /**
     * Get the amount of children
     * @member {number} FIRE.Transform#childCount
     */
    Transform.prototype.__defineGetter__('childCount', function () {
        return this._children.length;
    });

    /**
     * The local position in its parent's coordinate system
     * @member {FIRE.Vec2} FIRE.Transform#position
     */
    Transform.prototype.__defineGetter__('position', function () {
        return new Vec2(this._position.x, this._position.y);
    });
    Transform.prototype.__defineSetter__('position', function (value) {
        this._position.x = value.x;
        this._position.y = value.y;
    });

    /**
     * The local rotation in radians relative to the parent
     * @member {number} FIRE.Transform#rotation
     */
    Transform.prototype.__defineGetter__('rotation', function () {
        return this._rotation;
    });
    Transform.prototype.__defineSetter__('rotation', function (value) {
        this._rotation = value;
    });

    /**
     * The local scale factor relative to the parent
     * @member {FIRE.Vec2} FIRE.Transform#scale
     * @default new Vec2(1, 1)
     */
    Transform.prototype.__defineGetter__('scale', function () {
        return new Vec2(this._scale.x, this._scale.y);
    });
    Transform.prototype.__defineSetter__('scale', function (value) {
        this._scale.x = value.x;
        this._scale.y = value.y;
    });

    // override functions

    Transform.prototype.onCreate = function () {
        Engine._scene.appendRoot(this.entity);
    };

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

    Transform.prototype._updateTransform = function () {
        var _sr = this._rotation === 0 ? 0 : Math.sin(this._rotation);
        var _cr = this._rotation === 0 ? 1 : Math.cos(this._rotation);

        var parentTransform = this._parent._worldTransform;
        var _worldTransform = this._worldTransform;

        //var px = this._pivot.x;
        //var py = this._pivot.y;

        var a00 = _cr * this._scale.x,
            a01 = -_sr * this._scale.y,
            a10 = _sr * this._scale.x,
            a11 = _cr * this._scale.y,
            a02 = this._position.x/* - a00 * px - py * a01*/,
            a12 = this._position.y/* - a11 * py - px * a10*/,
            b00 = parentTransform.a, b01 = parentTransform.b,
            b10 = parentTransform.c, b11 = parentTransform.d;

        _worldTransform.a = b00 * a00 + b01 * a10;
        _worldTransform.b = b00 * a01 + b01 * a11;
        _worldTransform.tx = b00 * a02 + b01 * a12 + parentTransform.tx;

        _worldTransform.c = b10 * a00 + b11 * a10;
        _worldTransform.d = b10 * a01 + b11 * a11;
        _worldTransform.ty = b10 * a02 + b11 * a12 + parentTransform.ty;

        //this._worldAlpha = this._alpha * this._parent._worldAlpha;

        // update children
        var children = this._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i]._updateTransform();
        }
    };

    Transform.prototype._updateRootTransform = function () {
        var _sr = this._rotation === 0 ? 0 : Math.sin(this._rotation);
        var _cr = this._rotation === 0 ? 1 : Math.cos(this._rotation);

        var _worldTransform = this._worldTransform;

        //var px = this._pivot.x;
        //var py = this._pivot.y;
        
        _worldTransform.a = _cr * this._scale.x;    // 00
        _worldTransform.b = -_sr * this._scale.y;   // 01
        _worldTransform.tx = this._position.x/* - _worldTransform.a * px - py * _worldTransform.b*/;    //  02

        _worldTransform.c = _sr * this._scale.x;    // 10
        _worldTransform.d = _cr * this._scale.y;    // 11
        _worldTransform.ty = this._position.y/* - _worldTransform.d * py - px * _worldTransform.c*/;    // 12

        //this._worldAlpha = this._alpha;

        // update children
        var children = this._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i]._updateTransform();
        }
    };

    Transform.prototype.isChildOf = function (parent) {
        var child = this;
        do {
            if (child === parent) {
                return true;
            }
            child = child._parent;
        }
        while (child);
        return false;
    };

    return Transform;
})();

FIRE.Transform = Transform;
