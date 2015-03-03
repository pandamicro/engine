var Component = (function () {

    /**
     * used in _callOnEnable to ensure onEnable and onDisable will be called alternately
     * 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
     * 例如Entity.destory调用后但还未真正销毁时，会调用所有Component的OnDisable。
     * 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。
     */
    var IsOnEnableCalled = Fire._ObjectFlags.IsOnEnableCalled;

    // IsOnEnableCalled 会收到 executeInEditMode 的影响，IsEditorOnEnabledCalled 不会
    var IsEditorOnEnabledCalled = Fire._ObjectFlags.IsEditorOnEnabledCalled;
    var IsOnLoadCalled = Fire._ObjectFlags.IsOnLoadCalled;
    var IsOnStartCalled = Fire._ObjectFlags.IsOnStartCalled;

    var compCtor;
// @ifdef EDITOR
    compCtor = function () {
        Fire._AssetsWatcher.initComponent(this);
    };
// @endif

    /**
     *
     * Base class for everything attached to Entity
     * NOTE: Not allowed to use construction parameters for Component's subclasses,
     *       because Component is created by the engine.
     * @class Component
     * @static
     *
     */
    var Component = Fire.extend('Fire.Component', HashObject, compCtor);

    Component.prop('entity', null, Fire.HideInInspector);

    // enabled self
    Component.prop('_enabled', true, Fire.HideInInspector);

    // properties
    /**
     * If component is enabled.
     * @property enabled
     * @type boolean
     */
    Object.defineProperty(Component.prototype, 'enabled', {
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            // jshint eqeqeq: false
            if (this._enabled != value) {
                // jshint eqeqeq: true
                this._enabled = value;
                if (this.entity._activeInHierarchy) {
                    _callOnEnable(this, value);
                }
            }
        }
    });

    /**
     * If the component is enabled in hierarchy.
     * @property enabledInHierarchy
     * @type Transform
     */
    Object.defineProperty(Component.prototype, 'enabledInHierarchy', {
        get: function () {
            return this._enabled && this.entity._activeInHierarchy;
        }
    });

    /**
     * Returns the {% crosslink Fire.Transform Transform %} attached to the entity.
     * @property transform
     * @type Transform
     */
    Object.defineProperty(Component.prototype, 'transform', {
        get: function () {
            return this.entity.transform;
        }
    });

    // callback functions
    /**
     * Update is called every frame, if the Component is enabled.
     * @event update
     */
    Component.prototype.update = null;

    /**
     * LateUpdate is called every frame, if the Component is enabled.
     * @event lateUpdate
     */
    Component.prototype.lateUpdate = null;
    //(NYI) Component.prototype.onCreate = null;  // customized constructor for template
    /**
     * When attaching to an active entity or its entity first activated
     * @event onLoad
     */
    Component.prototype.onLoad = null;    //
    Component.prototype.onStart = null;   // called before all scripts' update if the Component is enabled
    Component.prototype.onEnable = null;
    Component.prototype.onDisable = null;
    Component.prototype.onDestroy = null;
    Component.prototype.onPreRender = null;

    /**
     * This method will be invoked when the scene graph changed, which is means the parent of its transform changed,
     * or one of its ancestor's parent changed, or one of their sibling index changed.
     * NOTE: This callback only available after onLoad.
     *
     * @param {Fire.Transform} transform - the transform which is changed, can be any of this transform's ancestor.
     * @param {Fire.Transform} oldParent - the transform's old parent, if not changed, its sibling index changed.
     * @return {boolean} return whether stop propagation to this component's child components.
     */
    //Component.prototype.onHierarchyChanged = function (transform, oldParent) {};

    // overrides

    Component.prototype.destroy = function () {
        if (FObject.prototype.destroy.call(this)) {
            if (this._enabled && this.entity._activeInHierarchy) {
                _callOnEnable(this, false);
            }
        }
    };

// @ifdef EDITOR
    function callOnEnableInTryCatch (c) {
        try {
            c.onEnable();
        }
        catch (e) {
            Fire.error(e);
        }
    }
    function callOnDisableInTryCatch (c) {
        try {
            c.onDisable();
        }
        catch (e) {
            Fire.error(e);
        }
    }
    function callOnLoadInTryCatch (c) {
        try {
            c.onLoad();
        }
        catch (e) {
            Fire.error(e);
        }
    }
    function callOnStartInTryCatch (c) {
        try {
            c.onStart();
        }
        catch (e) {
            Fire.error(e);
        }
    }
    function callOnDestroyInTryCatch (c) {
        try {
            c.onDestroy();
        }
        catch (e) {
            Fire.error(e);
        }
    }
// @endif

    // Should not call onEnable/onDisable in other place
    function _callOnEnable (self, enable) {
// @ifdef EDITOR
        if ( enable ) {
            if ( !(self._objFlags & IsEditorOnEnabledCalled) ) {
                self._objFlags |= IsEditorOnEnabledCalled;
                if ( editorCallback.onComponentEnabled ) {
                    editorCallback.onComponentEnabled(self);
                }
            }
        }
        else {
            if ( self._objFlags & IsEditorOnEnabledCalled ) {
                self._objFlags &= ~IsEditorOnEnabledCalled;
                if ( editorCallback.onComponentDisabled ) {
                    editorCallback.onComponentDisabled(self);
                }
            }
        }
        if ( !(Fire.Engine.isPlaying || Fire.attr(self, 'executeInEditMode')) ) {
            return;
        }
// @endif
        if ( enable ) {
            if ( !(self._objFlags & IsOnEnableCalled) ) {
                self._objFlags |= IsOnEnableCalled;
                if ( self.onEnable ) {
// @ifdef EDITOR
                    callOnEnableInTryCatch(self);
// @endif
// @ifndef EDITOR
                    self.onEnable();
// @endif
                }
            }

        }
        else {
            if ( self._objFlags & IsOnEnableCalled ) {
                self._objFlags &= ~IsOnEnableCalled;
                if ( self.onDisable ) {
// @ifdef EDITOR
                    callOnDisableInTryCatch(self);
// @endif
// @ifndef EDITOR
                    self.onDisable();
// @endif
                }
            }
        }
    }

    Component.prototype._onEntityActivated = function (active) {
// @ifdef EDITOR
        if ( !(this._objFlags & IsOnLoadCalled) && (Fire.Engine.isPlaying || Fire.attr(this, 'executeInEditMode')) ) {
            this._objFlags |= IsOnLoadCalled;
            if (this.onLoad) {
                callOnLoadInTryCatch(this);
            }
            Fire._AssetsWatcher.start(this);
            //if (this.onHierarchyChanged) {
            //    this.entity.transform._addListener(this);
            //}
        }
// @endif
// @ifndef EDITOR
        if ( !(this._objFlags & IsOnLoadCalled) ) {
            this._objFlags |= IsOnLoadCalled;
            if (this.onLoad) {
                this.onLoad();
            }
            //if (this.onHierarchyChanged) {
            //    this.entity.transform._addListener(this);
            //}
        }
// @endif
        if (this._enabled) {
            _callOnEnable(this, active);
        }
    };

    /**
     * invoke starts on entities
     * @method _invokeStarts
     * @param {Fire.Entity} entity
     */
    Component._invokeStarts = function (entity) {
        var countBefore = entity._components.length;
        var c = 0, comp = null;
        // @ifdef EDITOR
        if (Fire.Engine.isPlaying) {
        // @endif
            for (; c < countBefore; ++c) {
                comp = entity._components[c];
                if ( !(comp._objFlags & IsOnStartCalled) ) {
                    comp._objFlags |= IsOnStartCalled;
                    if (comp.onStart) {
                        // @ifdef EDITOR
                        callOnStartInTryCatch(comp);
                        // @endif
                        // @ifndef EDITOR
                        comp.onStart();
                        // @endif
                    }
                }
            }
        // @ifdef EDITOR
        }
        else {
            for (; c < countBefore; ++c) {
                comp = entity._components[c];
                if ( !(comp._objFlags & IsOnStartCalled) && Fire.attr(comp, 'executeInEditMode')) {
                    comp._objFlags |= IsOnStartCalled;
                    if (comp.onStart) {
                        callOnStartInTryCatch(comp);
                    }
                }
            }
        }
        // @endif
        // activate its children recursively
        for (var i = 0, children = entity._children, len = children.length; i < len; ++i) {
            var child = [i];
            if (child._active) {
                Component._invokeStarts(child);
            }
        }
    };

    Component.prototype._onPreDestroy = function () {
        // ensure onDisable called
        _callOnEnable(this, false);
        // onDestroy
// @ifdef EDITOR
        Fire._AssetsWatcher.stop(this);
        if (Fire.Engine.isPlaying || Fire.attr(this, 'executeInEditMode')) {
            if (this.onDestroy) {
                callOnDestroyInTryCatch(this);
            }
        }
// @endif
// @ifndef EDITOR
        if (this.onDestroy) {
            this.onDestroy();
        }
// @endif
        // remove component
        this.entity._removeComponent(this);
    };

    return Component;
})();

Fire.Component = Component;

// Register Component Menu

// @ifdef EDITOR
Fire._componentMenuItems = [];
// @endif

/**
 * Register a component to the "Component" menu.
 *
 * @method addComponentMenu
 * @static
 * @param {function} constructor - the class you want to register, must inherit from Component
 * @param {string} menuPath - the menu path name. Eg. "Rendering/Camera"
 * @param {number} [priority] - the order which the menu item are displayed
 */
Fire.addComponentMenu = function (constructor, menuPath, priority) {
    // @ifdef EDITOR
    Fire._componentMenuItems.push({
        component: constructor,
        menuPath: menuPath,
        priority: priority
    });
    // @endif
};

// @ifdef EDITOR
Fire.attr(Component, 'executeInEditMode', false);
// @endif

/**
 * Makes a component execute in edit mode.
 * By default, all components are only executed in play mode,
 * which means they will not have their callback functions executed while the Editor is in edit mode.
 * By calling this function, each component will also have its callback executed in edit mode.
 *
 * @method executeInEditMode
 * @static
 * @param {function} constructor - the class you want to register, must inherit from Component
 */
Fire.executeInEditMode = function (constructor) {
    // @ifdef EDITOR
    Fire.attr(constructor, 'executeInEditMode', true);
    // @endif
};

var _requiringFrame = [];  // the requiring frame infos

Fire._RFpush = function (uuid, script) {
    if (arguments.length === 1) {
        script = uuid;
        uuid = '';
    }
    _requiringFrame.push({
        uuid: uuid,
        script: script
    });
};
Fire._RFpop = function () {
    _requiringFrame.pop();
};

function doDefineComp (base, ctor) {
    var frame = _requiringFrame[_requiringFrame.length - 1];
    if (frame) {
        var className = frame.script;
        var cls = Fire.extend(className, base, ctor);
        if (frame.uuid) {
            JS._setClassId(frame.uuid, cls);
        }
        return cls;
    }
// @ifdef DEV
    else {
        Fire.error('Sorry, defining Component dynamically is not allowed, define during loading script please.');
        return null;
    }
// @endif
}

// @ifdef DEV
function checkCompCtor (constructor, scopeName) {
    if (constructor) {
        if (typeof constructor !== 'function') {
            Fire.error(scopeName + ' Constructor must be function type');
            return false;
        }
        if (Fire.isChildClassOf(constructor, Component)) {
            Fire.error(scopeName + ' Constructor can not be another Component');
            return false;
        }
        if (Fire._isFireClass(constructor)) {
            Fire.error(scopeName + ' Constructor can not be another FireClass');
            return false;
        }
        if (constructor.length > 0) {
            // To make a unified FireClass serialization process,
            // we don't allow parameters for constructor when creating instances of FireClass.
            // For advance user, construct arguments can get from 'arguments'.
            Fire.error(scopeName + ' Can not instantiate FireClass with arguments.');
            return false;
        }
    }
    return true;
}
// @endif

/**
 * @method defineComponent
 * @static
 * @param {function} [constructor]
 */
Fire.defineComponent = function (constructor) {
// @ifdef DEV
    if ( !checkCompCtor(constructor, '[Fire.defineComponent]') ) {
        return;
    }
// @endif
    return doDefineComp(Component, constructor);
};

/**
 * @method extendComponent
 * @static
 * @param {function} baseClass
 * @param {function} [constructor]
 */
Fire.extendComponent = function (baseClass, constructor) {
// @ifdef DEV
    if ( !baseClass ) {
        Fire.error('[Fire.extendComponent] baseClass must be non-nil, or use Fire.defineComponent instead.');
        return;
    }
    if ( !Fire.isChildClassOf(baseClass, Component) ) {
        Fire.error('[Fire.extendComponent] Base class must inherit from Component');
        return;
    }
    if ( !checkCompCtor(constructor, '[Fire.extendComponent]') ) {
        return;
    }
// @endif
    return doDefineComp(baseClass, constructor);
    //var superCtorCalled = this.hasOwnProperty('_name');
};
