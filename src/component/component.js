var Component = (function () {

    /**
     * @class Fire.Component
     * NOTE: Not allowed to use construction parameters for Component's subclasses,
     *       because Component is created by the engine.
     */
    var Component = Fire.define('Fire.Component', HashObject, function () {
        HashObject.call(this);

        // used in _callOnEnable to ensure onEnable and onDisable will be called alternately
        this._isOnEnableCalled = false;     // TODO: use flag
            // 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
            // 例如Entity.destory调用后但还未真正销毁时，会调用所有Component的OnDisable。
            // 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。

        this._isOnLoadCalled = false;   // TODO: use flag

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
    //(NYI) Component.prototype.onCreate = null;  // customized constructor for template
    Component.prototype.onLoad = null;    // when attaching to an active entity or its entity first activated
    //(NYI) Component.prototype.onStart = null;   // called just before first update, but after onEnable
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
            if ( !self._isOnEnableCalled ) {
                self._isOnEnableCalled = true;
                if ( self.onEnable ) {
                    self.onEnable();
                }
                if ( editorCallback.onComponentEnabled ) {
                    editorCallback.onComponentEnabled(self);
                }
            }
        }
        else {
            if ( self._isOnEnableCalled ) {
                self._isOnEnableCalled = false;
                if ( self.onDisable ) {
                    self.onDisable();
                }
                if ( editorCallback.onComponentDisabled ) {
                    editorCallback.onComponentDisabled(self);
                }
            }
        }
    };

    Component.prototype._onEntityActivated = function (active) {
        if (!this._isOnLoadCalled) {
            this._isOnLoadCalled = true;
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
