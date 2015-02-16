
var ModifierKeyStates = (function () {

    /**
     * @param {string} type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
     */
    function ModifierKeyStates (type, nativeEvent) {
        Fire.Event.call(this, type, true);

        this.nativeEvent = null;
        this.ctrlKey = false;
        this.shiftKey = false;
        this.altKey = false;
        this.metaKey = false;
    }
    Fire.extend(ModifierKeyStates, Fire.Event);

    /**
     * Returns the current state of the specified modifier key. true if the modifier is active (i.e., the modifier key is pressed or locked). Otherwise, false.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.getModifierState
     *
     * @param {string} keyArg - A modifier key value. The value must be one of the KeyboardEvent.key values which represent modifier keys or "Accel". This is case-sensitive.
     *                          NOTE: If an application wishes to distinguish between right and left modifiers, this information could be deduced using keyboard events and Fire.KeyboardEvent.location.
     * @return {boolean} true if it is a modifier key and the modifier is activated, false otherwise.
     */
    ModifierKeyStates.prototype.getModifierState = function (keyArg) {
        return nativeEvent.getModifierState(keyArg);
    };

    /**
     * @param {MouseEvent|KeyboardEvent|TouchEvent} nativeEvent - The original DOM event
     */
    ModifierKeyStates.prototype.initFromNativeEvent = function (nativeEvent) {
        this.nativeEvent = nativeEvent;
        this.ctrlKey = nativeEvent.ctrlKey;
        this.shiftKey = nativeEvent.shiftKey;
        this.altKey = nativeEvent.altKey;
        this.metaKey = nativeEvent.metaKey;
    };

    ModifierKeyStates.prototype._reset = function () {
        Event.prototype._reset.call(this);
        this.nativeEvent = null;
        this.ctrlKey = false;
        this.shiftKey = false;
        this.altKey = false;
        this.metaKey = false;
    };

    return ModifierKeyStates;
})();

Fire.ModifierKeyStates = ModifierKeyStates;

Fire.KeyboardEvent = KeyboardEvent;

var MouseEvent = (function () {

    /**
     * @param {string} type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     * http://www.quirksmode.org/dom/w3c_events.html#mousepos
     */
    function MouseEvent (type) {
        Fire.ModifierKeyStates.call(this, type);

        /**
         * @property {number} button - indicates which button was pressed on the mouse to trigger the event.
         *                             (0: Left button, 1: Wheel button or middle button (if present), 2: Right button)
         */
        this.button = 0;

        /**
         * @property {number} buttonStates - indicates which buttons were pressed on the mouse to trigger the event
         * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent.buttons
         */
        this.buttonStates = 0;

        this.screenX = 0;
        this.screenY = 0;

        /**
         * @property {number} deltaX - The X coordinate of the mouse pointer relative to the position of the last mousemove event.
         */
        this.deltaX = 0;

        /**
         * @property {number} deltaY - The Y coordinate of the mouse pointer relative to the position of the last mousemove event.
         */
        this.deltaY = 0;

        /**
         * @property {Fire.EventTarget} relatedTarget - The secondary target for the event, if there is one.
         */
        this.relatedTarget = null;
    }
    Fire.extend(MouseEvent, ModifierKeyStates);

    var TouchEvent = window.TouchEvent;

    /**
     * @param {MouseEvent} nativeEvent - The original DOM event
     */
    MouseEvent.prototype.initFromNativeEvent = function (nativeEvent) {
        ModifierKeyStates.prototype.initFromNativeEvent.call(this, nativeEvent);

        this.button = nativeEvent.button;
        this.buttonStates = nativeEvent.buttons;
        this.screenX = nativeEvent.offsetX;
        this.screenY = nativeEvent.offsetY;
        this.deltaX = nativeEvent.movementX;
        this.deltaY = nativeEvent.movementY;
        this.relatedTarget = nativeEvent.relatedTarget;
    };

    MouseEvent.prototype._reset = function () {
        ModifierKeyStates.prototype._reset.call(this);

        this.button = 0;
        this.buttonStates = 0;
        this.screenX = 0;
        this.screenY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.relatedTarget = null;
    };

    return MouseEvent;
})();

Fire.MouseEvent = MouseEvent;
