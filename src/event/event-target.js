var EventTarget = (function () {

    /**
     * EventTarget is an object to which an event is dispatched when something has occurred.
     * Entity are the most common event targets, but other objects can be event targets too.
     * 
     * Event targets are an important part of the Fireball-x event model.
     * The event target serves as the focal point for how events flow through the scene graph.
     * When an event such as a mouse click or a keypress occurs, Fireball-x dispatches an event object
     * into the event flow from the root of the hierarchy. The event object then makes its way through
     * the scene graph until it reaches the event target, at which point it begins its return trip through
     * the scene graph. This round-trip journey to the event target is conceptually divided into three phases:
     * - The capture phase comprises the journey from the root to the last node before the event target's node
     * - The target phase comprises only the event target node
     * - The bubbling phase comprises any subsequent nodes encountered on the return trip to the root of the hierarchy
	 * See also: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
     */
    function EventTarget() {
        HashObject.call(this);

        this._capturingListeners = null;
        this._bubblingListeners = null;
    }
    Fire.extend(EventTarget, HashObject);

    /**
     * Register an callback of a specific event type on the EventTarget
     * 
     * @param {string} type - A string representing the event type to listen for.
     * @param {function} callback - The callback that will be invoked when the event is dispatched.
     *                              The callback is ignored if it is a duplicate (the callbacks are unique).
     * @param {boolean} [useCapture=false] - When set to true, the capture argument prevents callback
     *                              from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE.
     *                              When false, callback will NOT be invoked when event's eventPhase attribute value is CAPTURING_PHASE.
     *                              Either way, callback will be invoked when event's eventPhase attribute value is AT_TARGET.
     */
    EventTarget.prototype.on = function (type, callback, useCapture) {
        useCapture = typeof useCapture !== "undefined" ? useCapture : false;
        if (!callback) {
            Fire.error('Callback of event must be non-nil');
            return;
        }
        if (useCapture) {
            this._capturingListeners = this._capturingListeners || new Fire.CallbacksInvoker();
            this._capturingListeners.add(type, callback);
        }
        else {
            this._bubblingListeners = this._bubblingListeners || new Fire.CallbacksInvoker();
            this._bubblingListeners.add(type, callback);
        }
    };

    /**
     * Removes the callback previously registered with the same type, callback, and capture.
     * 
     * @param {string} type - A string representing the event type being removed.
     * @param {function} callback - The callback to be removed.
     * @param {boolean} [useCapture=false] - Specifies whether the callback being removed was registered as a capturing callback or not.
     *                              If not specified, useCapture defaults to false. If a callback was registered twice,
     *                              one with capture and one without, each must be removed separately. Removal of a capturing callback
     *                              does not affect a non-capturing version of the same listener, and vice versa.
     */
    EventTarget.prototype.off = function (type, callback, useCapture) {
        useCapture = typeof useCapture !== "undefined" ? useCapture : false;
        if (!callback) {
            return;
        }
        var listeners = useCapture ? this._capturingListeners : this._bubblingListeners;
        if (listeners) {
            listeners.remove();
        }
    };

    /**
     * Dispatches an event into the event flow. The event target is the EventTarget object upon which the dispatchEvent() method is called.
     * 
     * @param {Fire.Event} event - The Event object that is dispatched into the event flow
     * @returns {boolean} - returns true if either it's preventDefault() method was not invoked,
     *                      or event's cancelable attribute value is false, and false otherwise.
     */
    EventTarget.prototype.dispatchEvent = function (event) {
        event._reset();
        event.target = this;

        // Event.CAPTURING_PHASE;
        event.eventPhase = 1;
        // TODO: propagate event.currentTarget
        this._capturingListeners.invoke(event.type, event);
        if (event._propagationStopped) {
            return ! event._defaultPrevented;
        }

        // Event.AT_TARGET
        event.eventPhase = 2;
        event.currentTarget = this;
        this._capturingListeners.invoke(event.type, event);
        if (event._propagationStopped) {
            return ! event._defaultPrevented;
        }
        this._bubblingListeners.invoke(event.type, event);
        if (event._propagationStopped) {
            return ! event._defaultPrevented;
        }
        
        // Event.BUBBLING_PHASE
        event.eventPhase = 3;
        // TODO: propagate event.currentTarget
        this._bubblingListeners.invoke(event.type, event);
        if (event._propagationStopped) {
            return ! event._defaultPrevented;
        }
    };

    return EventTarget;
})();

Fire.EventTarget = EventTarget;
