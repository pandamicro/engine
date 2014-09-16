var Component = (function () {

    /**
     * Not allowed to use construction parameters for its subclasses.
     * @class FIRE.Component
     */
    var Component = FIRE.define('FIRE.Component', FObject, function () {
        FObject.call(this);

        // used in _callOnEnable to ensure onEnable and onDisable will be called alternately
        this._isOnEnableCalled = false;     // TODO: use flag
            // 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
            // 例如Entity.destory调用后但还未真正销毁时，会调用所有Component的OnDisable。
            // 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。
        
        this._isOnLoadCalled = false;   // TODO: use flag
    });

    Component.prop('entity', null, FIRE.HideInInspector);

    // enabled self
    Component.prop('_enabled', true, FIRE.HideInInspector);

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
                if (this.entity.activeInHierarchy) {
                    _callOnEnable(this, value);
                }
            }
        }
    });

    Object.defineProperty(Component.prototype, 'enabledInHierarchy', {
        get: function () {
            return this._enabled && this.entity.activeInHierarchy;
        }
    });

    Object.defineProperty(Component.prototype, 'transform', {
        get: function () {
            return this.entity.transform;
        }
    });
   
    /* callback functions
    Component.prototype.onCreate = function () {};  // (NYI) customized constructor for template
    Component.prototype.onLoad = function () {};    // when attaching to an active entity or its entity first activated
    Component.prototype.onStart = function () {};   // (NYI) called just before first update, but after onEnable
    Component.prototype.onEnable = function () {};
    Component.prototype.onDisable = function () {};
    Component.prototype.update = function () {};
    Component.prototype.onDestroy = function () {};
    */

    // overrides

    Component.prototype.destroy = function () {
        if (FObject.prototype.destroy.call(this)) {
            if (this._enabled && this.entity.activeInHierarchy) {
                _callOnEnable(this, false);
            }
        }
    };

    // Should not call onEnable/onDisable in other place
    var _callOnEnable = function (self, enable) {
        if (enable) {
            if (!self._isOnEnableCalled && self.onEnable) {
                self.onEnable();
                self._isOnEnableCalled = true;
            }
        }
        else {
            if (self._isOnEnableCalled && self.onDisable) {
                self.onDisable();
                self._isOnEnableCalled = false;
            }
        }
    };

    Component.prototype._onEntityActivated = function (activeInHierarchy) {
        if (!this._isOnLoadCalled) {
            this._isOnLoadCalled = true;
            if (this.onLoad) {
                this.onLoad();
            }
        }
        if (this._enabled) {
            _callOnEnable(this, activeInHierarchy);
        }
    };
    
    Component.prototype._onPreDestroy = function () {
        // ensure onDisable called
        _callOnEnable(this, false);
        // onDestroy
        if (this.onDestroy) {
            this.onDestroy();
        }
        // remove component
        this.entity._removeComponent(this);
    };

    return Component;
})();

FIRE.Component = Component;
