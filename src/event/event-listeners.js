var EventListeners = (function () {

    /**
     * Extends Fire._CallbacksHandler to handle and invoke event callbacks.
     */
    function EventListeners () {
        Fire._CallbacksHandler.call(this);
    }
    Fire.extend(EventListeners, Fire._CallbacksHandler);

    /**
     * @param {Fire.Event} event
     */
    EventListeners.prototype.invoke = function (event) {
        var list = this._callbackTable[event.type];
        if (list) {
            for (var i = 0; i < list.length; i++) {
                list[i](event);
                if (event._propagationImmediateStopped) {
                    break;
                }
            }
        }
    };

    return EventListeners;
})();
