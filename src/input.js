var Input = (function () {

    var Input = {
        _eventListeners: new EventListeners()
    };

    Object.defineProperty(Input, 'hasTouch', {
        get: function () {
            return !!Engine._inputContext && Engine._inputContext.hasTouch;
        }
    });

    Input.on = function (type, callback) {
        if (callback) {
            this._eventListeners.add(type, callback);
        }
        else {
            Fire.error('Callback must be non-nil');
        }
    };

    Input.off = function (type, callback) {
        if (callback) {
            if (! this._eventListeners.remove(type, callback)) {
                Fire.warn('Callback not exists');
            }
        }
        else {
            Fire.error('Callback must be non-nil');
        }
    };

    Input._reset = function () {
        this._eventListeners = new EventListeners();
    };

    Input._dispatchMouseEvent = function (event, inputContext) {
        var camera = inputContext.renderContext.camera || Engine._scene.camera;
        var worldMousePos = camera.screenToWorld(new Vec2(event.screenX, event.screenY));
        var target = Engine._interactionContext.pick(worldMousePos);
        if (target) {
            target.dispatchEvent(event);
        }
    };

    Input._dispatchEvent = function (event, inputContext) {
        // dispatch global event
        this._eventListeners.invoke(event);
        // dispatch mouse event through hierarchy
        if (event instanceof Fire.MouseEvent) {
            this._dispatchMouseEvent(event, inputContext);
        }
    };

    return Input;
})();

Fire.Input = Input;
