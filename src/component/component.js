FIRE.Component = (function () {
    var _super = FIRE.FObject;

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
    };

    // properties
    Component.prototype.__defineGetter__('enabled', function () { return this._enabled; });
    Component.prototype.__defineSetter__('enabled', function (value) {
        if (this._enabled != value) {
            this._enabled = value;
            if (this.entity.activeInHierarchy) {
                _callOnEnable(this, value);
            }
        }
    });
    Component.prototype.__defineGetter__('enabledInHierarchy', function () {
        return this._enabled && this.entity.activeInHierarchy;
    });

    /* virtual functions
    Component.prototype.onEnable = function () {};
    Component.prototype.onDisable = function () {};
    Component.prototype.update = function () {};
    */

    // overrides

    Component.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this._enabled && this.entity.activeInHierarchy) {
            _callOnEnable(this, false);
        }
    };

    var _callOnEnable = function (self, enable) {
        if (enable) {
            if (self.onEnable) {
                self.onEnable();
            }
        }
        else {
            if (self.onDisable) {
                self.onDisable();
            }
        }
    };

    Component.prototype._onEntityActivated = function (activeInHierarchy) {
        if (this._enabled) {
            _callOnEnable(this, activeInHierarchy);
        }
    };
    
    Component.prototype._onPreDestroy = function () {
        if (this.onDestroy) {
            this.onDestroy();
        }
        this.entity._removeComponent(this);
    };

    return Component;
})();
