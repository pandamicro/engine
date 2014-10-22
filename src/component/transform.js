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
     * @property {Fire.Transform} Fire.Transform#parent
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
                if (value) {
                    if ((value.entity._objFlags & SceneGizmo) && !(this.entity._objFlags & SceneGizmo)) {
                        Fire.error('child of SceneGizmo must be SceneGizmo');
                        return;
                    }
                    if (!oldParent) {
                        Engine._scene.removeRoot(this.entity);
                    }
                    value._children.push(this);
                }
                else {
                    Engine._scene.appendRoot(this.entity);
                }
                this._parent = value || null;
                if (oldParent && !(oldParent.entity._objFlags & Destroying)) {
                    oldParent._children.splice(oldParent._children.indexOf(this), 1);
                    this.entity._onHierarchyChanged(oldParent); // TODO 这里需要有oldParent?
                }
                Engine._renderContext.onTransformParentChanged(this, oldParent);
                if (editorCallback.onEntityParentChanged) {
                    editorCallback.onEntityParentChanged(this.entity);
                }
                //this._onHierarchyChanged(this, oldParent);
            }
        }
    });

    /**
     * Get the amount of children
     * @property {number} Fire.Transform#childCount
     */
    Object.defineProperty(Transform.prototype, 'childCount', {
        get: function () {
            return this._children.length;
        },
    });

    /**
     * The local position in its parent's coordinate system
     * @property {Fire.Vec2} Fire.Transform#position
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
            if ( this.parent ) {
                var w2l = this.parent.getWorldToLocalMatrix();
                value = w2l.transformPoint(value);
                this.position = value;
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
            if ( this.parent ) {
                return this.rotation + this.parent.worldRotation;
            }
            else {
                return this.rotation;
            }
        },
        set: function (value) {
            if ( this.parent ) {
                this.rotation = value - this.parent.worldRotation;
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
        // invoke callbacks
        Engine._renderContext.onTransformCreated(this);
    };

    Transform.prototype.getChild = function (index) {
        return this._children[index];
    };

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
     * NOTE: If this transform does not have parent and not belongs to the current scene, 
     *       The return value will be -1
     * 
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
            var ent = Engine._scene.entities[index];
            return ent && ent.transform;
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
        index = index !== -1 ? index : array.length - 1;
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
            if (editorCallback.onEntityIndexChanged) {
                editorCallback.onEntityIndexChanged(this.entity, oldIndex, index);
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
        this.setSiblingIndex(-1);
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
