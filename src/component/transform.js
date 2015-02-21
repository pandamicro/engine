var Transform = (function () {

    /**
     * Position, rotation and scale of an object.
     * @class Transform
     * @extends Component
     */

    var Transform = Fire.extend('Fire.Transform', Component, function () {
        Component.call(this);

        this._position = new Vec2(0, 0);
        this._scale = new Vec2(1, 1);

        this._worldTransform = new Matrix23();

        /**
         * @property {Fire.Transform} _parent - the cached reference to parent transform
         * @default null
         */
        this._parent = null;

        //this._hierarchyChangedListeners = null;
    });

    Fire.executeInEditMode(Transform);

    Transform.prop('_position', null, Fire.HideInInspector);
    Transform.prop('_rotation', 0, Fire.HideInInspector);
    Transform.prop('_scale', null, Fire.HideInInspector);

    // properties

    /**
     * The local position in its parent's coordinate system
     * @member {Fire.Vec2} position
     * @instance
     */
    Transform.getset('position',
        function () {
            return new Vec2(this._position.x, this._position.y);
        },
        function (value) {
            this._position.x = value.x;
            this._position.y = value.y;
        },
        Fire.Tooltip("The local position in its parent's coordinate system")
    );

    /**
     * The position of the transform in world space
     * @property {Fire.Vec2} Fire.Transform#worldPosition
     */
    Object.defineProperty(Transform.prototype, 'worldPosition', {
        get: function () {
            var l2w = this.getLocalToWorldMatrix();
            return new Vec2(l2w.tx, l2w.ty);
        },
        set: function (value) {
            if ( this._parent ) {
                var w2l = this._parent.getWorldToLocalMatrix();
                this.position = w2l.transformPoint(value);
            }
            else {
                this.position = value;
            }
        }
    });

    /**
     * The counterclockwise degrees of rotation relative to the parent
     * @property {number} Fire.Transform#rotation
     */
    Transform.getset('rotation',
        function () {
            return this._rotation;
        },
        function (value) {
            this._rotation = value;
        },
        Fire.Tooltip('The counterclockwise degrees of rotation relative to the parent')
    );

    /**
     * The counterclockwise degrees of rotation in world space
     * @property {number} Fire.Transform#worldRotation
     */
    Object.defineProperty(Transform.prototype, 'worldRotation', {
        get: function () {
            if ( this._parent ) {
                return this.rotation + this._parent.worldRotation;
            }
            else {
                return this.rotation;
            }
        },
        set: function (value) {
            if ( this._parent ) {
                this.rotation = value - this._parent.worldRotation;
            }
            else {
                this.rotation = value;
            }
        }
    });

    /**
     * The local scale factor relative to the parent
     * @property {Fire.Vec2} Fire.Transform#scale
     * @default new Vec2(1, 1)
     */
    Transform.getset('scale',
        function () {
            return new Vec2(this._scale.x, this._scale.y);
        },
        function (value) {
            this._scale.x = value.x;
            this._scale.y = value.y;
        },
        Fire.Tooltip('The local scale factor relative to the parent')
    );

    /**
     * The lossy scale of the transform in world space (Read Only)
     * @property {Fire.Vec2} Fire.Transform#worldScale
     */
    Object.defineProperty(Transform.prototype, 'worldScale', {
        get: function () {
            var l2w = this.getLocalToWorldMatrix();
            return l2w.getScale();
        }
    });

    /**
     * @private
     */
    Object.defineProperty(Transform.prototype, 'parent', {
        get: function () {
            Fire.error('Transform.parent is obsolete. Use Entity.parent instead.');
            return null;
        },
        set: function (value) {
            Fire.error('Transform.parent is obsolete. Use Entity.parent instead.');
        }
    });

    // override functions

    Transform.prototype.onLoad = function () {
        this._parent = this.entity._parent && this.entity._parent.transform;
    };

    Transform.prototype.destroy = function () {
        Fire.error("Not allowed to destroy the transform. Please destroy the entity instead.");
        return;
    };

    // other functions

    Transform.prototype._updateTransform = function (parentMatrix) {
        //var mat = this._worldTransform;

        //var px = this._pivot.x;
        //var py = this._pivot.y;

        //var radians = this._rotation * 0.017453292519943295;
        //var sin = this._rotation === 0 ? 0 : Math.sin(radians);
        //var cos = this._rotation === 0 ? 1 : Math.cos(radians);

        //// get local
        //mat.a = this._scale.x * cos;
        //mat.b = this._scale.x * sin;   // 这里如果是pixi，b和c是反过来的
        //mat.c = this._scale.y * - sin;
        //mat.d = this._scale.y * cos;
        //mat.tx = this._position.x;
        //mat.ty = this._position.y;

        //// parent
        //var pa = parentMatrix.a;
        //var pb = parentMatrix.b;
        //var pc = parentMatrix.c;
        //var pd = parentMatrix.d;

        //// local x parent
        //if (pa !== 1 || pb !== 0 || pc !== 0 || pd !== 1) {
        //    mat.a = mat.a * pa + mat.b * pc;
        //    mat.b = mat.a * pb + mat.b * pd;
        //    mat.c = mat.c * pa + mat.d * pc;
        //    mat.d = mat.c * pb + mat.d * pd;
        //    mat.tx = mat.tx * pa + mat.ty * pc + parentMatrix.tx;
        //    mat.ty = mat.tx * pb + mat.ty * pd + parentMatrix.ty;
        //}
        //else {
        //    mat.tx += parentMatrix.tx;
        //    mat.ty += parentMatrix.ty;
        //}

        var mat = this._worldTransform;
        this.getLocalMatrix(mat);
        mat.prepend(parentMatrix);

        //this._worldAlpha = this._alpha * this._parent._worldAlpha;

        // update children
        var children = this.entity._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i].transform._updateTransform(mat);
        }
    };

    Transform.prototype._updateRootTransform = function () {
        var mat = this._worldTransform;
        this.getLocalMatrix(mat);
        //this._worldAlpha = this._alpha;

        // update children
        var children = this.entity._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i].transform._updateTransform(mat);
        }
    };

    /**
     * Get the local matrix that transforms a point from local space into parents space.
     * @method Fire.Transform#getLocalMatrix
     * @param {Fire.Matrix23} [out]
     * @return {Fire.Matrix23}
     */
    Transform.prototype.getLocalMatrix = function (out) {
        out = out || new Matrix23();

        //var px = this._pivot.x;
        //var py = this._pivot.y;

        var radians = this._rotation * 0.017453292519943295;
        var sin = this._rotation === 0 ? 0 : Math.sin(radians);
        var cos = this._rotation === 0 ? 1 : Math.cos(radians);

        out.a = this._scale.x * cos;   // scaleMat.a * rotateMat.a(cos) 00
        // 这里如果是pixi，b和c是反过来的
        out.b = this._scale.x * sin;   // scaleMat.a * rotateMat.b(sin)
        out.c = this._scale.y * - sin; // scaleMat.d * rotateMat.c(-sin)
        //
        out.d = this._scale.y * cos;   // scaleMat.d * rotateMat.d(cos) 11
        out.tx = this._position.x;/* * ra + this._position.y * rc*/
        out.ty = this._position.y;/* * rb + this._position.y * rd*/
        //out.tx = this._position.x/* - out.a * px - py * out.b*/;    // 02
        //out.ty = this._position.y/* - out.d * py - px * out.c*/;    // 12

        //above should equivalent to:
        //  var t = new Matrix23();
        //  t.tx = this._position.x;
        //  t.ty = this._position.y;
        //  var r = new Matrix23();
        //  r.rotate(radians);
        //  var s = new Matrix23();
        //  s.setScale(this._scale);
        //  out.set(s.prepend(r).prepend(t));

        return out;
    };

    /**
     * Get the world transform matrix that transforms a point from local space into world space.
     * @method Transform#getLocalToWorldMatrix
     * @param {Fire.Matrix23} [out]
     * @return {Fire.Matrix23}
     */
    Transform.prototype.getLocalToWorldMatrix = function (out) {
        // todo, merge with this._worldTransform
        out = out || new Matrix23();
        this.getLocalMatrix(out);
        var t = new Fire.Matrix23();
        for (var p = this._parent; p !== null; p = p._parent) {
            out.prepend(p.getLocalMatrix(t));
        }
        return out;
    };

    /**
     * Get the inverse world transform matrix that transforms a point from world space into local space.
     * @method Transform#getWorldToLocalMatrix
     * @param {Fire.Matrix23} [out]
     * @return {Fire.Matrix23}
     */
    Transform.prototype.getWorldToLocalMatrix = function (out) {
        return this.getLocalToWorldMatrix(out).invert();
    };

    /**
     * @method Transform#rotateAround
     * @param {Fire.Vec2} point - the world point rotates through
     * @param {number} angle - degrees
     */
    Transform.prototype.rotateAround = function (point, angle) {
        var delta = this.worldPosition.subSelf(point);
        delta.rotateSelf(Math.deg2rad(angle));
        this.worldPosition = point.addSelf(delta);
        this.rotation = this._rotation + angle;
    };

    /**
     * @property {Fire.Vec2} up - up direction, point to the y(green) axis
     */
    Object.defineProperty(Transform.prototype, 'up', {
        get: function () {
            return (new Vec2(0.0, 1.0)).rotateSelf(Math.deg2rad(this.worldRotation));
        },
        set: function (value) {
            if (value.x === 0.0 && value.y === 0.0) {
                Fire.warn("Can't get rotation from zero vector");
                return;
            }
            var radians = Math.atan2(value.y, value.x) - Math.HALF_PI;
            this.worldRotation = Math.rad2deg(radians);
        }
    });

    /**
     * @property {Fire.Vec2} right - right direction, point to the x(red) axis
     */
    Object.defineProperty(Transform.prototype, 'right', {
        get: function () {
            return (new Vec2(1.0, 0.0)).rotateSelf(Math.deg2rad(this.worldRotation));
        },
        set: function (value) {
            if (value.x === 0.0 && value.y === 0.0) {
                Fire.warn("Can't get rotation from zero vector");
                return;
            }
            var radians = Math.atan2(value.y, value.x);
            this.worldRotation = Math.rad2deg(radians);
        }
    });

    ///**
    // * Subscribe the `onHierarchyChanged` event.
    // * When this transform or one of its parents' hierarchy changed, the `onHierarchyChanged`
    // * method will be invoked on supplied instance of Component. If you want to unsubscribe this event,
    // * you must destroy the Component.
    // * 这里不支持自定义回调，因为如果忘了反注册很容易就会内存泄漏。
    // *
    // * @method Fire.Transform#_addListener
    // * @param {Fire.Component} component - the component to be invoked.
    // * @private
    // */
    //Transform.prototype._addListener = function (component) {
    //    //if (component.entity === this.entity) {
    //        if (this._hierarchyChangedListeners) {
    //            this._hierarchyChangedListeners.push(component);
    //        }
    //        else {
    //            this._hierarchyChangedListeners = [component];
    //        }
    //    //}
    //    //else {
    //    //    Fire.error("Can not listen other entity's onHierarchyChanged event");
    //    //}
    //};

    //// 这里就算不调用，内存也不会泄露，因为component本身就会被destroy。
    //// 只不过调用了以后内存能清理的更及时。
    //Transform.prototype._removeListener = function (component) {
    //    if (this._hierarchyChangedListeners) {
    //        var idx = this._hierarchyChangedListeners.indexOf(component);
    //        this._hierarchyChangedListeners.splice(idx, 1);
    //    }
    //};

    //Transform.prototype._onHierarchyChanged = function (transform, oldParent) {
    //    // notify self listener
    //    if (this._hierarchyChangedListeners) {
    //        for (var i = this._hierarchyChangedListeners.length - 1; i >= 0; --i) {
    //            var target = this._hierarchyChangedListeners[i];
    //            if (target.isValid) {
    //                if (target.onHierarchyChanged(transform, oldParent)) {
    //                    // 目前只有一种component会终止事件，如果有多种，这里需要做分类
    //                    return;
    //                }
    //            }
    //            else {
    //                this._hierarchyChangedListeners.splice(i, 1);
    //            }
    //        }
    //    }
    //    // notify children
    //    for (var c = 0, len = this._children.length; c < len; c++) {
    //        this._children[c]._onHierarchyChanged(transform, oldParent);
    //    }
    //};

    return Transform;
})();

Fire.Transform = Transform;
