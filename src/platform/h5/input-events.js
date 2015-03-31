
var ModifierKeyStates = (function () {

    /**
     * @class ModifierKeyStates
     * @constructor
     * @param {string} type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit".
     * @param {UIEvent} [nativeEvent=null] - The native event object attaching to this event object.
     * @beta
     */
    function ModifierKeyStates (type, nativeEvent) {
        Fire.Event.call(this, type, true);

        /**
         * @property nativeEvent
         * @type {UIEvent}
         * @private
         */
        this.nativeEvent = null;

        /**
         * Returns true if the `ctrl` key was down when the event was fired.
         * @property ctrlKey
         * @type {boolean}
         */
        this.ctrlKey = false;
        /**
         * Returns true if the `shift` key was down when the event was fired.
         * @property shiftKey
         * @type {boolean}
         */
        this.shiftKey = false;
        /**
         * Returns true if the `alt` key was down when the event was fired.
         * @property altKey
         * @type {boolean}
         */
        this.altKey = false;
        /**
         * Returns true if the `meta` key was down when the event was fired.
         * @property metaKey
         * @type {boolean}
         */
        this.metaKey = false;
    }
    JS.extend(ModifierKeyStates, Fire.Event);

    /**
     * Returns the current state of the specified modifier key. true if the modifier is active (i.e., the modifier key is pressed or locked). Otherwise, false.
     *
     * See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.getModifierState
     *
     * @method getModifierState
     * @param {string} keyArg - A modifier key value. The value must be one of the KeyboardEvent.key values which represent modifier keys or "Accel". This is case-sensitive.
     *                          NOTE: If an application wishes to distinguish between right and left modifiers, this information could be deduced using keyboard events and Fire.KeyboardEvent.location.
     * @return {boolean} true if it is a modifier key and the modifier is activated, false otherwise.
     */
    ModifierKeyStates.prototype.getModifierState = function (keyArg) {
        return nativeEvent.getModifierState(keyArg);
    };

    /**
     * @method initFromNativeEvent
     * @param {UIEvent} nativeEvent - The original DOM event
     * @private
     */
    ModifierKeyStates.prototype.initFromNativeEvent = function (nativeEvent) {
        this.nativeEvent = nativeEvent;
        this.ctrlKey = nativeEvent.ctrlKey;
        this.shiftKey = nativeEvent.shiftKey;
        this.altKey = nativeEvent.altKey;
        this.metaKey = nativeEvent.metaKey;
    };

    /**
     * @method _reset
     * @private
     */
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

/**
 * KeyboardEvent objects describe a user interaction with the keyboard. Each event describes a key; the event type (keydown, keypress, or keyup) identifies what kind of activity was performed.
 * This class is just an alias to the Web [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
 *
 * @class KeyboardEvent
 * @constructor
 * @beta
 */
Fire.KeyboardEvent = window.KeyboardEvent;  // should use window for Safari

var MouseEvent = (function () {

    /**
     * The MouseEvent interface represents events that occur due to the user interacting with a pointing device (such as a mouse). Common events using this interface include click, dblclick, mouseup, mousedown.
     *
     * See
     * - https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
     * - http://www.quirksmode.org/dom/w3c_events.html#mousepos
     *
     * @class MouseEvent
     * @extends ModifierKeyStates
     * @constructor
     * @param {string} type - The name of the event (case-sensitive), e.g. "click", "fire", or "submit"
     *
     * @beta
     */
    function MouseEvent (type) {
        Fire.ModifierKeyStates.call(this, type);

        /**
         * Indicates which button was pressed on the mouse to trigger the event.
         *
         * (0: Left button, 1: Wheel button or middle button (if present), 2: Right button)
         * @property button
         * @type {number}
         * @default 0
         */
        this.button = 0;

        /**
         * Indicates which buttons were pressed on the mouse to trigger the event
         *
         * See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent.buttons
         * @property buttonStates
         * @type {number}
         * @default 0
         */
        this.buttonStates = 0;

        /**
         * The X coordinate of the mouse pointer in screen coordinates.
         * @property screenX
         * @type {number}
         */
        this.screenX = 0;

        /**
         * The Y coordinate of the mouse pointer in screen coordinates.
         * @property screenY
         * @type {number}
         */
        this.screenY = 0;

        /**
         * The X coordinate of the mouse pointer relative to the position of the last mousemove event.
         * Not available for touch event.
         * @property deltaX
         * @type {number}
         */
        this.deltaX = 0;

        /**
         * The Y coordinate of the mouse pointer relative to the position of the last mousemove event.
         * Not available for touch event.
         * @property deltaY
         * @type {number}
         */
        this.deltaY = 0;

        /**
         * The secondary target for the event, if there is one.
         * @property relatedTarget
         * @type {EventTarget}
         */
        this.relatedTarget = null;
    }
    JS.extend(MouseEvent, ModifierKeyStates);

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
