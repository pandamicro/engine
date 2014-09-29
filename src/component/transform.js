var Transform = (function () {

    /**
     * @class
     * @alias Fire.Transform
     * @extends Fire.Component
     */ 
    var Transform = Fire.define('Fire.Transform', Component, function () {
        Component.call(this);
        
        this._position = new Vec2(0, 0);
        this._scale = new Vec2(1, 1);

        this._worldTransform = new Matrix23();

        //this._hierarchyChangedListeners = null;
    });

    Transform.prop('_parent', null, Fire.HideInInspector);
    Transform.prop('_children', [], Fire.HideInInspector);
    Transform.prop('_position', null, Fire.HideInInspector);
    Transform.prop('_rotation', 0, Fire.HideInInspector);
    Transform.prop('_scale', null, Fire.HideInInspector);

    // properties

    /**
     * The parent of the transform.
     * Changing the parent will keep the local space position, rotation and scale the same but modify the world space position, scale and rotation.
     * @member {Fire.Transform} Fire.Transform#parent
     */
    Object.defineProperty(Transform.prototype, 'parent', {
        get: function () {
            return this._parent;
        },
        set: function (value) {
            if (this._parent !== value) {
                if (value === this) {
                    Fire.warn("A transform can't be set as the parent of itself.");
                    return;
                }
                if (value && !(value instanceof Transform)) {
                    if (value instanceof Entity) {
                        Fire.error('transform.parent can not be an Entity, use entity.transform instead.');
                    }
                    else {
                        Fire.error('transform.parent must be instance of Transform (or must be null)');
                    }
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
                if (oldParent && !(oldParent.entity._objFlags & Destroying)) {
                    oldParent._children.splice(oldParent._children.indexOf(this), 1);
                    this.entity._onHierarchyChanged(oldParent);
                }
                Engine._renderContext.onTransformParentChanged(this, oldParent);
                if (editorCallback.onTransformParentChanged) {
                    editorCallback.onTransformParentChanged(this, oldParent);
                }
                //this._onHierarchyChanged(this, oldParent);
            }
        }
    });

    /**
     * Get the amount of children
     * @member {number} Fire.Transform#childCount
     */
    Object.defineProperty(Transform.prototype, 'childCount', {
        get: function () {
            return this._children.length;
        },
    });

    

    /**
     * The local position in its parent's coordinate system
     * @member {Fire.Vec2} Fire.Transform#position
     */
    Transform.getset('position', 
        function () {
            return new Vec2(this._position.x, this._position.y);
        },
        function (value) {
            this._position.x = value.x;
            this._position.y = value.y;
        }
    );

    /**
     * The local rotation in radians relative to the parent
     * @member {number} Fire.Transform#rotation
     */
    Transform.getset('rotation', 
        function () {
            return this._rotation;
        },
        function (value) {
            this._rotation = value;
        }
    );

    /**
     * The local scale factor relative to the parent
     * @member {Fire.Vec2} Fire.Transform#scale
     * @default new Vec2(1, 1)
     */
    Transform.getset('scale',
        function () {
            return new Vec2(this._scale.x, this._scale.y);
        },
        function (value) {
            this._scale.x = value.x;
            this._scale.y = value.y;
        }
    );

    // override functions

    Transform.prototype.onDestroy = function () {
        var parent = this._parent;
        var alsoDestroyParent = (parent && (parent.entity._objFlags & Destroying));
        if (parent) {
            if (!alsoDestroyParent) {
                parent._children.splice(parent._children.indexOf(this), 1);
            }
        }
        else {
            Engine._scene.removeRoot(this.entity);
        }

        if (!alsoDestroyParent) {
            // callbacks
            Engine._renderContext.onTransformRemoved(this);
            if (editorCallback.onTransformRemoved) {
                editorCallback.onTransformRemoved(this);
            }
        }

        // destroy child entitys
        var children = this._children;
        for (var i = 0, len = children.length; i < len; ++i) {
            var entity = children[i].entity;
            entity._destroyImmediate();
        }
    };

    Transform.prototype.destroy = function () {
        Fire.error("Not allowed to destroy the transform. Please destroy the entity instead.");
        return;
    };
    
    // other functions

    Transform.prototype.create = function () {
        if (Engine._scene) {
            Engine._scene.appendRoot(this.entity);
        }
        // invoke callbacks
        Engine._renderContext.onTransformCreated(this);
        if (editorCallback.onTransformCreated) {
            editorCallback.onTransformCreated(this);
        }
    };

    Transform.prototype.getChild = function (index) {
        return this._children[index];
    };

    Transform.prototype._updateTransform = function (parentMatrix) {
        var _sr = this._rotation === 0 ? 0 : Math.sin(this._rotation);
        var _cr = this._rotation === 0 ? 1 : Math.cos(this._rotation);

        var mat = this._worldTransform;

        //var px = this._pivot.x;
        //var py = this._pivot.y;

        var a00 = _cr * this._scale.x,
            a01 = -_sr * this._scale.y,
            a10 = _sr * this._scale.x,
            a11 = _cr * this._scale.y,
            a02 = this._position.x/* - a00 * px - py * a01*/,
            a12 = this._position.y/* - a11 * py - px * a10*/,
            b00 = parentMatrix.a, b01 = parentMatrix.b,
            b10 = parentMatrix.c, b11 = parentMatrix.d;

        mat.a = b00 * a00 + b01 * a10;
        mat.b = b00 * a01 + b01 * a11;
        mat.tx = b00 * a02 + b01 * a12 + parentMatrix.tx;

        mat.c = b10 * a00 + b11 * a10;
        mat.d = b10 * a01 + b11 * a11;
        mat.ty = b10 * a02 + b11 * a12 + parentMatrix.ty;

        //this._worldAlpha = this._alpha * this._parent._worldAlpha;

        // update children
        var children = this._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i]._updateTransform(mat);
        }
    };

    Transform.prototype._updateRootTransform = function () {
        var mat = this._worldTransform;
        this.getLocalMatrix(mat);
        //this._worldAlpha = this._alpha;

        // update children
        var children = this._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i]._updateTransform(mat);
        }
    };

    /**
     * Get the local matrix that transforms a point from local space into parents space.
     * @method Fire.Transform#getLocalMatrix
     * @param {Fire.Matrix23} [out]
     * @returns {Fire.Matrix23}
     */
    Transform.prototype.getLocalMatrix = function (out) {
        out = out || new Matrix23();

        var _sr = this._rotation === 0 ? 0 : Math.sin(this._rotation);
        var _cr = this._rotation === 0 ? 1 : Math.cos(this._rotation);

        //var px = this._pivot.x;
        //var py = this._pivot.y;
        
        out.a = _cr * this._scale.x;    // 00
        out.b = -_sr * this._scale.y;   // 01
        out.tx = this._position.x/* - out.a * px - py * out.b*/;    // 02

        out.c = _sr * this._scale.x;    // 10
        out.d = _cr * this._scale.y;    // 11
        out.ty = this._position.y/* - out.d * py - px * out.c*/;    // 12

        return out;
    };

    /**
     * Get the world transform matrix that transforms a point from local space into world space.
     * @method Transform#getLocalToWorldMatrix
     * @param {Fire.Matrix23} [out]
     * @returns {Fire.Matrix23}
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
     * @returns {Fire.Matrix23}
     */
    Transform.prototype.getWorldToLocalMatrix = function (out) {
        return this.getLocalToWorldMatrix(out).invert();
    };

    /**
     * is or is child of
     */
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

    /**
     * Get the sibling index.
     * @method Fire.Transform#getSiblingIndex
     * @returns {number}
     */
    Transform.prototype.getSiblingIndex = function () {
        if (this._parent) {
            return this._parent._children.indexOf(this);
        }
        else {
            return Engine._scene.entities.indexOf(this.entity);
        }
    };

    /**
     * Get the indexed sibling.
     * @method Fire.Transform#getSibling
     * @param {number} index
     * @returns {Fire.Transform}
     */
    Transform.prototype.getSibling = function (index) {
        if (this._parent) {
            return this._parent._children[index];
        }
        else {
            return Engine._scene.entities[index];
        }
    };

    /**
     * Set the sibling index.
     * @method Fire.Transform#setSiblingIndex
     * @param {number} index
     */
    Transform.prototype.setSiblingIndex = function (index) {
        var array = this._parent ? this._parent._children : Engine._scene.entities;
        var item = this._parent ? this : this.entity;
        var oldIndex = array.indexOf(item);
        if (index !== oldIndex) {
            array.splice(oldIndex, 1);
            if (index < array.length) {
                array.splice(index, 0, item);
            }
            else {
                array.push(item);
            }
            // callback
            Engine._renderContext.onTransformIndexChanged(this, oldIndex, index);
            if (editorCallback.onTransformIndexChanged) {
                editorCallback.onTransformIndexChanged(this, oldIndex, index);
            }
            //this._onHierarchyChanged(this, this.parent);
        }
    };
    
    /**
     * Move the transform to the top.
     * @method Fire.Transform#setAsFirstSibling
     */
    Transform.prototype.setAsFirstSibling = function () {
        this.setSiblingIndex(0);
    };

    /**
     * Move the transform to the bottom.
     * @method Fire.Transform#setAsFirstSibling
     */
    Transform.prototype.setAsLastSibling = function () {
        if (this._parent) {
            this.setSiblingIndex(this._parent._children.length);
        }
        else {
            this.setSiblingIndex(Engine._scene.entities.length);
        }
    };

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
    //                    // TODO: 目前只有一种component会终止事件，如果有多种，这里需要做分类
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
