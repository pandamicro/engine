var InputContext = (function () {

    /**
     * http://www.quirksmode.org/dom/events/index.html
     */
    var InputContext = function (renderContext) {
        this.renderContext = renderContext;
        // bind event
        var canvas = renderContext.renderer.view;
        for (var eventType in EventRegister.inputEvents) {
            canvas.addEventListener(eventType, this.onDomInputEvent.bind(this), false);
        }
    };

    InputContext.prototype.onDomInputEvent = function (domEvent) {
        // wrap event
        var eventInfo = EventRegister.inputEvents[domEvent.type];
        var event = new eventInfo.constructor(domEvent.type, domEvent);
        event.bubbles = eventInfo.bubbles;
        // event.cancelable = eventInfo.cancelable; (NYI)

        // inner dispatch
        InputDispatcher.dispatchEvent(event, this);

        // update dom event
        if (event._defaultPrevented) {
            domEvent.preventDefault();
        }
        if (event._propagationStopped) {
            if (event._propagationImmediateStopped) {
                domEvent.stopImmediatePropagation();
            }
            else {
                domEvent.stopPropagation();
            }
        }
    };

    return InputContext;
})();
