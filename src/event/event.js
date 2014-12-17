var Event = (function () {

    /**
     * An event allows for signaling that something has occurred. E.g. that an asset has completed downloading.
     * @param {string} type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
     * @param {boolean} [bubbles=false] - A boolean indicating whether the event bubbles up through the tree or not
     */
    function Event (type, bubbles) {
        //HashObject.call(this);
        if (typeof bubbles === 'undefined') { bubbles = false; }

        /**
         * The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
         * @property {string}
         */
        this.type = type;

        /**
         * A reference to the target to which the event was originally dispatched
         * @property {object}
         */
        this.target = null;

        /**
         * A reference to the currently registered target for the event
         * @property {object}
         */
        this.currentTarget = null;

        /**
         * Indicates which phase of the event flow is currently being evaluated.
         * Returns an integer value represented by 4 constants:
         *  - Event.NONE = 0
         *  - Event.CAPTURING_PHASE = 1
         *  - Event.AT_TARGET = 2
         *  - Event.BUBBLING_PHASE = 3
         * The phases are explained in the [section 3.1, Event dispatch and DOM event flow]
         * (http://www.w3.org/TR/DOM-Level-3-Events/#event-flow), of the DOM Level 3 Events specification.
         *
         * @property {number}
         */
        this.eventPhase = 0;

        /**
         * A boolean indicating whether the event bubbles up through the hierarchy or not
         * @property {boolean}
         */
        this.bubbles = bubbles;

        /**
         * Indicates whether or not event.preventDefault() has been called on the event
         * @property {boolean}
         */
        this._defaultPrevented = false;

        /**
         * Indicates whether or not event.stop() has been called on the event
         * @property {boolean}
         */
        this._propagationStopped = false;

        /**
         * Indicates whether or not event.stop(true) has been called on the event
         * @property {boolean}
         */
        this._propagationImmediateStopped = false;

        //this.cancelable = false;
        //this.clipboardData = undefined;
        //this.path = NodeList[0];
        //this.returnValue = true;
        //this.srcElement = null;
        //this.timeStamp = 1415761681529;
    }

    /**
	 * Events not currently dispatched are in this phase
	 * @constant {number}
     */
    Event.NONE = 0;
    /**
	 * The capturing phase comprises the journey from the root to the last node before the event target's node
	 * see http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
	 * @constant {number}
     */
    Event.CAPTURING_PHASE = 1;
    /**
	 * The target phase comprises only the event target node
	 * see http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
	 * @constant {number}
     */
    Event.AT_TARGET = 2;
    /**
	 * The bubbling phase comprises any subsequent nodes encountered on the return trip to the root of the hierarchy
	 * see http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
	 * @constant {number}
     */
    Event.BUBBLING_PHASE = 3;

    /**
     * Stop propagation. When dispatched in a tree, invoking this method prevents event from reaching any other objects than the current.
     * @param {boolean} [immediate=false] - Indicates whether or not to immediate stop the propagation, default is false.
     *                                      If true, for this particular event, no other callback will be called. Neither those attached on the same event target,
     *                                      nor those attached on targets which will be traversed later.
     */
    Event.prototype.stop = function (immediate) {
        this._propagationStopped = true;
        if (immediate) {
            this._propagationImmediateStopped = true;
        }
    };

    /**
     * If invoked when the cancelable attribute value is true, signals to the operation that caused event to be dispatched that it needs to be canceled.
     */
    Event.prototype.preventDefault = function () {
        this._defaultPrevented = true;
    };

    Event.prototype._reset = function () {
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = 0;
        this._defaultPrevented = false;
        this._propagationStopped = false;
        this._propagationImmediateStopped = false;
    };

    return Event;
})();

Fire.Event = Event;
