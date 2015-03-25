var Entity = Fire.Class({

    name: 'Fire.Entity', extends: EventTarget,

    constructor: function () {
        var name = arguments[0];

        this._name = typeof name !== 'undefined' ? name : 'New Entity';
        this._objFlags |= Entity._defaultFlags;

        if (Fire._isCloning) {
            // create by deserializer or instantiating

            this._activeInHierarchy = false;
        }
        else {
            // create dynamically

            this._activeInHierarchy = true;
            // init transform
            var transform = new Transform();
            transform.entity = this;
            this._components = [transform];
            this.transform = transform;
            // add to scene
            if (Engine._scene) {
                Engine._scene.appendRoot(this);
            }
            // invoke callbacks
            Engine._renderContext.onRootEntityCreated(this);

            // activate componet
            transform._onEntityActivated(true);     // 因为是刚刚创建，所以 activeInHierarchy 肯定为 true

// @ifdef EDITOR
            if (editorCallback.onEntityCreated) {
                editorCallback.onEntityCreated(this);
            }
            if (editorCallback.onComponentAdded) {
                editorCallback.onComponentAdded(this, transform);
            }
// @endif
        }
    },

    properties: {

        name: {
            get: function () {
                return this._name;
            },
            set: function (value) {
                this._name = value;
                // @ifdef EDITOR
                if (editorCallback.onEntityRenamed) {
                    editorCallback.onEntityRenamed(this);
                }
                // @endif
            }
        },

        active: {
            get: function () {
                return this._active;
            },
            set: function (value) {
                // jshint eqeqeq: false
                if (this._active != value) {
                    // jshint eqeqeq: true
                    this._active = value;
                    var canActiveInHierarchy = (!this._parent || this._parent._activeInHierarchy);
                    if (canActiveInHierarchy) {
                        this._onActivatedInHierarchy(value);
                    }
                }
            }
        },

        activeInHierarchy: {
            get: function () {
                return this._activeInHierarchy;
            }
        },

        transform: {
            default: null,
            hideInInspector: true
        },

        /**
         * The parent of the entity.
         * Changing the parent will keep the transform's local space position, rotation and scale the same but modify the world space position, scale and rotation.
         * @property {Fire.Entity} Fire.Entity#parent
         */
        parent: {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                if (this._parent !== value) {
                    if (value === this) {
                        Fire.warn("A entity can't be set as the parent of itself.");
                        return;
                    }
                    if (value && !(value instanceof Entity)) {
                        if (value instanceof Transform) {
                            Fire.error('Entity.parent can not be a Transform, use transform.entity instead.');
                        }
                        else {
                            Fire.error('Entity.parent must be instance of Entity (or must be null)');
                        }
                        return;
                    }
                    var oldParent = this._parent;
                    if (value) {
                        if ((value._objFlags & HideInGame) && !(this._objFlags & HideInGame)) {
                            Fire.error('Failed to set parent, the child\'s HideInGame must equals to parent\'s.');
                            return;
                        }
                        if ((value._objFlags & HideInEditor) && !(this._objFlags & HideInEditor)) {
                            Fire.error('Failed to set parent, the child\'s HideInEditor must equals to parent\'s.');
                            return;
                        }
                        if (!oldParent) {
                            Engine._scene.removeRoot(this);
                        }
                        value._children.push(this);
                    }
                    else {
                        Engine._scene.appendRoot(this);
                    }
                    this._parent = value || null;
                    this.transform._parent = this._parent && this._parent.transform;

                    if (oldParent && !(oldParent._objFlags & Destroying)) {
                        oldParent._children.splice(oldParent._children.indexOf(this), 1);
                        this._onHierarchyChanged(oldParent);
                    }
                    Engine._renderContext.onEntityParentChanged(this, oldParent);
// @ifdef EDITOR
                    if (editorCallback.onEntityParentChanged) {
                        editorCallback.onEntityParentChanged(this);
                    }
// @endif
                    //this._onHierarchyChanged(this, oldParent);
                }
            }
        },

        /**
         * Get the amount of children
         * @property {number} Fire.Entity#childCount
         */
        childCount: {
            get: function () {
                return this._children.length;
            },
            hideInInspector: true
        },

        dontDestroyOnLoad: {
            get: function () {
                return this.dontDestroyOnLoad;
            },
            set: function (value) {
                if (value) {
                    this._objFlags |= DontDestroy;
                }
                else {
                    this._objFlags &= ~DontDestroy;
                }
            }
        },

        // internal properties

        _active: {
            default: true,
            hideInInspector: true
        },
        _parent: {
            default: null,
            hideInInspector: true
        },
        _children: {
            default: [],
            hideInInspector: true
        },
        _components: {
            default: null,
            hideInInspector: true
        }
    },

    ////////////////////////////////////////////////////////////////////
    // overrides
    ////////////////////////////////////////////////////////////////////

    destroy: function () {
        if (FObject.prototype.destroy.call(this)) {
            // disable hierarchy
            if (this._activeInHierarchy) {
                this._deactivateChildComponents();
            }
        }
    },

    _onPreDestroy: function () {
        var parent = this._parent;
        this._objFlags |= Destroying;
        var isTopMost = !(parent && (parent._objFlags & Destroying));
        if (isTopMost) {
            Engine._renderContext.onEntityRemoved(this);
// @ifdef EDITOR
            if (editorCallback.onEntityRemoved) {
                editorCallback.onEntityRemoved(this/*, isTopMost*/);
            }
// @endif
        }
        // destroy components
        for (var c = 0; c < this._components.length; ++c) {
            var component = this._components[c];
            // destroy immediate so its _onPreDestroy can be called before
            component._destroyImmediate();
        }
        // remove self
        if (parent) {
            if (isTopMost) {
                parent._children.splice(parent._children.indexOf(this), 1);
            }
        }
        else {
            Engine._scene.removeRoot(this);
        }
        // destroy children
        var children = this._children;
        for (var i = 0, len = children.length; i < len; ++i) {
            // destroy immediate so its _onPreDestroy can be called before
            children[i]._destroyImmediate();
        }
    },

    /**
     * Get all the targets listening to the supplied type of event in the target's capturing phase.
     * The capturing phase comprises the journey from the root to the last node BEFORE the event target's node.
     * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
     * Subclasses can override this method to make event propagable.
     *
     * @param {string} type - the event type
     * @param {array} array - the array to receive targets
     */
    _getCapturingTargets: function (type, array) {
        for (var target = this._parent; target; target = target._parent) {
            if (target._activeInHierarchy && target._capturingListeners && target._capturingListeners.has(type)) {
                array.push(target);
            }
        }
    },

    /**
     * Get all the targets listening to the supplied type of event in the target's bubbling phase.
     * The bubbling phase comprises any SUBSEQUENT nodes encountered on the return trip to the root of the hierarchy.
     * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
     * Subclasses can override this method to make event propagable.
     *
     * @param {string} type - the event type
     * @param {array} array - the array to receive targets
     */
    _getBubblingTargets: function (type, array) {
        for (var target = this._parent; target; target = target._parent) {
            if (target._activeInHierarchy && target._bubblingListeners && target._bubblingListeners.has(type)) {
                array.push(target);
            }
        }
    },

    /**
     * Send an event to this object directly, this method will not propagate the event to any other objects.
     *
     * @param {Fire.Event} event - The Event object that is sent to this event target.
     */
    _doSendEvent: function (event) {
        if (this._activeInHierarchy) {
            Entity.$super.prototype._doSendEvent.call(this, event);
        }
    },

    ////////////////////////////////////////////////////////////////////
    // component methods
    ////////////////////////////////////////////////////////////////////

    /**
     * @param {function|string} typeOrTypename
     * @return {Component}
     */
    addComponent: function (typeOrTypename) {
        var constructor;
        if (typeof typeOrTypename === 'string') {
            constructor = JS.getClassByName(typeOrTypename);
            if ( !constructor ) {
                Fire.error('[addComponent] Failed to get class "%s"');
                if (_requiringFrames.length > 0) {
                    Fire.error('You should not add component when the scripts are still loading.', typeOrTypename);
                }
                return null;
            }
        }
        else {
            if ( !typeOrTypename ) {
                Fire.error('[addComponent] Type must be non-nil');
                return null;
            }
            constructor = typeOrTypename;
        }
        if (this._objFlags & Destroying) {
            Fire.error('isDestroying');
            return null;
        }
        if (typeof constructor !== 'function') {
            Fire.error("The component to add must be a constructor");
            return null;
        }
        var component = new constructor();
        component.entity = this;
        this._components.push(component);

        if (this._activeInHierarchy) {
            // call onLoad/onEnable
            component._onEntityActivated(true);
        }

// @ifdef EDITOR
        if (editorCallback.onComponentAdded) {
            editorCallback.onComponentAdded(this, component);
        }
// @endif
        return component;
    },

    /**
     * @param {function|string} typeOrTypename
     * @return {Component}
     */
    getComponent: function (typeOrTypename) {
        if ( !typeOrTypename ) {
            Fire.error('Argument must be non-nil');
            return;
        }
        var constructor;
        if (typeof typeOrTypename === 'string') {
            constructor = JS.getClassByName(typeOrTypename);
        }
        else {
            constructor = typeOrTypename;
        }
        for (var c = 0; c < this._components.length; ++c) {
            var component = this._components[c];
            if (component instanceof constructor) {
                return component;
            }
        }
        return null;
    },

    _removeComponent: function (component) {
        /*if (!component) {
            Fire.error('Argument must be non-nil');
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
// @ifdef EDITOR
                if (editorCallback.onComponentRemoved) {
                    editorCallback.onComponentRemoved(this, component);
                }
// @endif
            }
            else if (component.entity !== this) {
                Fire.error("Component not owned by this entity");
            }
        }
    },

    ////////////////////////////////////////////////////////////////////
    // hierarchy methods
    ////////////////////////////////////////////////////////////////////

    find: function (path) {
        if (!path && path !== '') {
            Fire.error('Argument must be non-nil');
            return;
        }
        if (path[0] === '/') {
            Fire.error("Path should not start with a '/' character, please use \"Fire.Entity.find\" instead");
            return;
        }
        var nameList = path.split('/');

        var match = this;
        var t = 0, len = 0, children = null, subEntity = null;
        for (var i = 0; i < nameList.length; i++) {
            var name = nameList[i];
            if (name === '..') {
                if (!match) {
                    return null;
                }
                match = match._parent;
            }
            else {
                if (!match) {
                    children = Engine._scene.entities;
                }
                else {
                    children = match._children;
                }
                match = null;
                for (t = 0, len = children.length; t < len; ++t) {
                    subEntity = children[t];
                    if (subEntity.name === name) {
                        match = subEntity;
                    }
                }
                if (!match) {
                    return null;
                }
            }
        }
        return match;
    },

    getChild: function (index) {
        return this._children[index];
    },

    getChildren: function () {
        return this._children.slice();
    },

    /**
     * is or is child of
     */
    isChildOf: function (parent) {
        var child = this;
        do {
            if (child === parent) {
                return true;
            }
            child = child._parent;
        }
        while (child);
        return false;
    },

    /**
     * Get the sibling index.
     * NOTE: If this entity does not have parent and not belongs to the current scene,
     *       The return value will be -1
     *
     * @method Fire.Entity#getSiblingIndex
     * @return {number}
     */
    getSiblingIndex: function () {
        if (this._parent) {
            return this._parent._children.indexOf(this);
        }
        else {
            return Engine._scene.entities.indexOf(this);
        }
    },

    /**
     * Get the indexed sibling.
     * @method Fire.Entity#getSibling
     * @param {number} index
     * @return {Fire.Entity}
     */
    getSibling: function (index) {
        if (this._parent) {
            return this._parent._children[index];
        }
        else {
            return Engine._scene.entities[index];
        }
    },

    /**
     * Set the sibling index.
     * @method Fire.Entity#setSiblingIndex
     * @param {number} index
     */
    setSiblingIndex: function (index) {
        var array = this._parent ? this._parent._children : Engine._scene.entities;
        var item = this;
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
            Engine._renderContext.onEntityIndexChanged(this, oldIndex, index);
// @ifdef EDITOR
            if (editorCallback.onEntityIndexChanged) {
                editorCallback.onEntityIndexChanged(this, oldIndex, index);
            }
// @endif
            //this._onHierarchyChanged(this, this.parent);
        }
    },

    /**
     * Move the entity to the top.
     * @method Fire.Entity#setAsFirstSibling
     */
    setAsFirstSibling: function () {
        this.setSiblingIndex(0);
    },

    /**
     * Move the entity to the bottom.
     * @method Fire.Entity#setAsFirstSibling
     */
    setAsLastSibling: function () {
        this.setSiblingIndex(-1);
    },

    ////////////////////////////////////////////////////////////////////
    // other methods
    ////////////////////////////////////////////////////////////////////

    _onActivatedInHierarchy: function (value) {
        this._activeInHierarchy = value;

        // 当引入DestroyImmediate后，_components的元素有可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
        // var components = this._components.slice();

        // component有可能在onEnable时增加，而新增的component已经onEnable了，所以这里事先记下长度，以免重复调用
        var countBefore = this._components.length;
        for (var c = 0; c < countBefore; ++c) {
            var component = this._components[c];
            component._onEntityActivated(value);
        }
        // activate children recursively
        for (var i = 0, len = this.childCount; i < len; ++i) {
            var entity = this._children[i];
            if (entity._active) {
                entity._onActivatedInHierarchy(value);
            }
        }
    },

    _deactivateChildComponents: function () {
        // 和 _onActivatedInHierarchy 类似但不修改 this._activeInHierarchy
        var countBefore = this._components.length;
        for (var c = 0; c < countBefore; ++c) {
            var component = this._components[c];
            component._onEntityActivated(false);
        }
        // deactivate children recursively
        for (var i = 0, len = this.childCount; i < len; ++i) {
            var entity = this._children[i];
            if (entity._active) {
                entity._deactivateChildComponents();
            }
        }
    },

    _onHierarchyChanged: function (oldParent) {
        var activeInHierarchyBefore = this._active && (!oldParent || oldParent._activeInHierarchy);
        var shouldActiveNow = this._active && (!this._parent || this._parent._activeInHierarchy);
        if (activeInHierarchyBefore !== shouldActiveNow) {
            this._onActivatedInHierarchy(shouldActiveNow);
        }
    },

    _instantiate: function (position, rotation) {
        // 临时实现版本，之后应该不拷贝scene object
        var oldParent = this._parent;
        this._parent = null;
        var clone = Fire._doInstantiate(this);
        this._parent = oldParent;
        // init
        if (Engine.isPlaying) {
            clone._name = this._name + '(Clone)';
        }
        if (position) {
            clone.transform._position = position;
        }
        if (rotation) {
            clone.transform._rotation = rotation;
        }
        if (Engine._scene) {
            Engine._scene.appendRoot(clone);
        }

        // invoke callbacks
        Engine._renderContext.onEntityCreated(clone, true);
// @ifdef EDITOR
        if (editorCallback.onEntityCreated) {
            editorCallback.onEntityCreated(clone);
        }
// @endif
        // activate components
        if (clone._active) {
            clone._onActivatedInHierarchy(true);
        }

        return clone;
    }
});

////////////////////////////////////////////////////////////////////
// static
////////////////////////////////////////////////////////////////////

/**
 * the temp property that indicates the current creating entity should
 * binded with supplied object flags.
 * only used in editor
 *
 * @property {number} Entity._defaultFlags
 * @private
 */
Entity._defaultFlags = 0;

/**
 * Finds an entity by hierarchy path, the path is case-sensitive, and must start with a '/' character.
 * It will traverse the hierarchy by splitting the path using '/' character.
 * It is recommended to not use this function every frame instead cache the result at startup.
 * @method Fire.Entity.find
 * @param {string} path
 * @return {Fire.Entity} the entity or null if not found
 */
Entity.find = function (path) {
    if (!path && path !== '') {
        Fire.error('Argument must be non-nil');
        return;
    }
    if (path[0] !== '/') {
        Fire.error("Path must start with a '/' character");
        return;
    }
    return Engine._scene.findEntity(path);
};

Fire.Entity = Entity;
