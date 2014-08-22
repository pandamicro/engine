var Component = (function () {
    var _super = FObject;

    // constructor
    function Component () {
        _super.call(this);
        init(this);
    }
    FIRE.extend(Component, _super);
    Component.prototype.__classname__ = "FIRE.Component";
    
    // init
    var init = function (self) {
        self.entity = null;

        self._enabled = true;      // enabled self

        // used in _callOnEnable to ensure onEnable and onDisable will be called alternately
        self._calledEnable = false;
            // 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
            // 例如Entity.destory调用后但还未真正销毁时，会调用所有Component的OnDisable。
            // 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。
    };

    // properties
    Component.prototype.__defineGetter__('enabled', function () { return this._enabled; });
    Component.prototype.__defineSetter__('enabled', function (value) {
        // jshint eqeqeq: false
        if (this._enabled != value) {
        // jshint eqeqeq: true
            this._enabled = value;
            if (this.entity.activeInHierarchy) {
                _callOnEnable(this, value);
            }
        }
    });
    Component.prototype.__defineGetter__('enabledInHierarchy', function () {
        return this._enabled && this.entity.activeInHierarchy;
    });
    Component.prototype.__defineGetter__('transform', function () {
        return this.entity.transform;
    });

    /* callback functions
    Component.prototype.onCreate = function () {};
    Component.prototype.onStart = function () {};   // (NYI) called just before first update, but after onEnable
    Component.prototype.onEnable = function () {};
    Component.prototype.onDisable = function () {};
    Component.prototype.update = function () {};
    Component.prototype.onDestroy = function () {};
    */

    // overrides

    Component.prototype.destroy = function () {
        if (_super.prototype.destroy.call(this)) {
            if (this._enabled && this.entity.activeInHierarchy) {
                _callOnEnable(this, false);
            }
        }
    };

    // Should not call onEnable/onDisable in other place
    var _callOnEnable = function (self, enable) {
        if (enable) {
            if (!self._calledEnable && self.onEnable) {
                self.onEnable();
                self._calledEnable = true;
            }
        }
        else {
            if (self._calledEnable && self.onDisable) {
                self.onDisable();
                self._calledEnable = false;
            }
        }
    };

    Component.prototype._onEntityActivated = function (activeInHierarchy) {
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
