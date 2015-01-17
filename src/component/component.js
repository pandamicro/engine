var Component = (function () {

    /**
     * @class Fire.Component
     * NOTE: Not allowed to use construction parameters for Component's subclasses,
     *       because Component is created by the engine.
     */
    var Component = Fire.define('Fire.Component', HashObject, function () {
        HashObject.call(this);

// @ifdef EDITOR
        AssetsWatcher.initComponent(this);
// @endif

    });

    Component.prop('entity', null, Fire.HideInInspector);

    // enabled self
    Component.prop('_enabled', true, Fire.HideInInspector);

    // properties
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

    Object.defineProperty(Component.prototype, 'enabledInHierarchy', {
        get: function () {
            return this._enabled && this.entity._activeInHierarchy;
        }
    });

    Object.defineProperty(Component.prototype, 'transform', {
        get: function () {
            return this.entity.transform;
        }
    });

    // callback functions
    Component.prototype.update = null;
    Component.prototype.lateUpdate = null;
    //(NYI) Component.prototype.onCreate = null;  // customized constructor for template
    Component.prototype.onLoad = null;    // when attaching to an active entity or its entity first activated
    Component.prototype.onStart = null;   // called before all scripts' update if the Component is enabled
    Component.prototype.onEnable = null;
    Component.prototype.onDisable = null;
    Component.prototype.onDestroy = null;

    /**
     * This method will be invoked when the scene graph changed, which is means the parent of its transform changed,
     * or one of its ancestor's parent changed, or one of their sibling index changed.
     * NOTE: This callback only available after onLoad.
     *
     * @param {Fire.Transform} transform - the transform which is changed, can be any of this transform's ancestor.
     * @param {Fire.Transform} oldParent - the transform's old parent, if not changed, its sibling index changed.
     * @returns {boolean} return whether stop propagation to this component's child components.
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

    // Should not call onEnable/onDisable in other place
    var _callOnEnable = function (self, enable) {
        if ( enable ) {
            if ( !(self._objFlags & IsOnEnableCalled) ) {
                self._objFlags |= IsOnEnableCalled;
                if ( self.onEnable ) {
                    self.onEnable();
                }
// @ifdef EDITOR
                if ( editorCallback.onComponentEnabled ) {
                    editorCallback.onComponentEnabled(self);
                }
// @endif
            }
        }
        else {
            if ( self._objFlags & IsOnEnableCalled ) {
                self._objFlags &= ~IsOnEnableCalled;
                if ( self.onDisable ) {
                    self.onDisable();
                }
// @ifdef EDITOR
                if ( editorCallback.onComponentDisabled ) {
                    editorCallback.onComponentDisabled(self);
                }
// @endif
            }
        }
    };

    Component.prototype._onEntityActivated = function (active) {
        if ( !(this._objFlags & IsOnLoadCalled) ) {
            this._objFlags |= IsOnLoadCalled;
            if (this.onLoad) {
                this.onLoad();
            }
// @ifdef EDITOR
            AssetsWatcher.start(this);
// @endif
            //if (this.onHierarchyChanged) {
            //    this.entity.transform._addListener(this);
            //}
        }
        if (this._enabled) {
            _callOnEnable(this, active);
        }
    };

    /**
     * invoke starts on entities
     * @param {Fire.Entity} entity
     */
    Component._invokeStarts = function (entity) {
        var countBefore = entity._components.length;
        for (var c = 0; c < countBefore; ++c) {
            var comp = entity._components[c];
            if ( !(comp._objFlags & IsOnStartCalled) ) {
                comp._objFlags |= IsOnStartCalled;
                if (comp.onStart) {
                    comp.onStart();
                }
            }
        }
        // activate its children recursively
        for (var i = 0, len = entity.childCount; i < len; ++i) {
            var child = entity._children[i];
            if (child._active) {
                Component._invokeStarts(child);
            }
        }
    };

    Component.prototype._onPreDestroy = function () {
        // ensure onDisable called
        _callOnEnable(this, false);
// @ifdef EDITOR
        AssetsWatcher.stop(this);
// @endif
        // onDestroy
        if (this.onDestroy) {
            this.onDestroy();
        }
        // remove component
        this.entity._removeComponent(this);
    };

    return Component;
})();

Fire.Component = Component;

/**
 * Register a component to the "Component" menu.
 *
 * @method Fire.addComponentMenu
 * @param {function} constructor - the class you want to register, must inherit from Component
 * @param {string} menuPath - the menu path name. Eg. "Rendering/Camera"
 * @param {number} [priority] - the order which the menu item are displayed
 */
Fire.addComponentMenu = Fire.addComponentMenu || function (constructor, menuPath, priority) {
    // implement only available in editor
};



var _requiringFrame = [];  // the requiring frame infos

Fire._RFpush = function (uuid, script) {
    _requiringFrame.push({
        uuid: uuid,
        script: script
    });
};
Fire._RFpop = function () {
    _requiringFrame.pop();
};

/**
 * @param {function} [baseOrConstructor]
 * @param {function} [constructor]
 */
Fire.defineComponent = function (baseOrConstructor, constructor) {
    var args = [''];    // class name will be defined later
    // check args
    if (arguments.length === 0) {
        args.push(Component);
    }
    else {
        if (arguments.length === 1) {
            if (Fire.isChildClassOf(baseOrConstructor, Component)) {
                // base
                args.push(baseOrConstructor);
            }
            else {
// @ifdef DEV
                if (!Fire._isFireClass(baseOrConstructor)) {
                    if (typeof baseOrConstructor !== 'function') {
                        Fire.error('[Fire.defineComponent] Constructor must be function type');
                        return;
                    }
// @endif
                    // base
                    args.push(Component);
                    // constructor
                    args.push(baseOrConstructor);
// @ifdef DEV
                }
                else {
                    Fire.error('[Fire.defineComponent] Base class must inherit from Component');
                    return;
                }
// @endif
            }
        }
        else {
// @ifdef DEV
            if (Fire.isChildClassOf(baseOrConstructor, Component)) {
                // base
                if (typeof constructor !== 'function') {
                    Fire.error('[Fire.defineComponent] Constructor must be function type');
                    return;
                }
// @endif
                // base
                args.push(baseOrConstructor);
                // constructor
                args.push(constructor);
// @ifdef DEV
            }
            else {
                Fire.error('[Fire.defineComponent] Base class must inherit from Component');
                return;
            }
// @endif
        }
    }
    //
    var frame = _requiringFrame[_requiringFrame.length - 1];
    if (frame) {
        var className = frame.script;
        args[0] = className;
        var cls = Fire.define.apply(Fire, args);
        Fire._setClassId(frame.uuid, cls);
        return cls;
    }
// @ifdef DEV
    else {
        Fire.error('[Fire.defineComponent] Sorry, defining Component dynamically is not allowed, define during loading script please.');
    }
// @endif
};
