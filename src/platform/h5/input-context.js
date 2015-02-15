var InputContext = (function () {

    function DomEventRegister (target) {
        this.target = target;
        this.events = [];
    }
    DomEventRegister.prototype.addEventListener = function (message, callback, useCapture) {
        this.target.addEventListener(message, callback, useCapture);
        this.events.push([message, callback, useCapture]);
    };
    DomEventRegister.prototype.removeAll = function () {
        for (var i = 0; i < this.events.length; i++) {
            var args = this.events[i];
            this.target.removeEventListener(args[0], args[1], args[2]);
        }
        this.events.length = 0;
    };

    /**
     * http://www.quirksmode.org/dom/events/index.html
     */
    var InputContext = function (renderContext) {
        var canvas = renderContext.renderer.view;
        canvas.tabIndex = canvas.tabIndex || 0;     // make key event receivable

        this.renderContext = renderContext;
        this.eventRegister = new DomEventRegister(canvas);
        this.hasTouch = 'ontouchstart' in window;

        // bind event
        var scope = this;
        function listener (event) {
            scope.onDomInputEvent(event);
        }
        for (var type in EventRegister.inputEvents) {
            //var info = EventRegister.inputEvents[type];
            //if (!(this.hasTouch && info.constructor instanceof MouseEvent)) {
                this.eventRegister.addEventListener(type, listener, true);
            //}
        }
        if (this.hasTouch) {
            this.simulateMouseEvent();
        }

        // focus the canvas to receive keyboard events
        function focusCanvas () {
            canvas.focus();
        }
        if (this.hasTouch) {
            this.eventRegister.addEventListener('touchstart', focusCanvas, true);
        }
        else {
            this.eventRegister.addEventListener('mousedown', focusCanvas, true);
        }
    };

    InputContext.prototype.simulateMouseEvent = function () {
        var scope = this;
        function getTouchListener (info) {
            var type = info.simulateType;
            if (type) {
                return function (domEvent) {
                    // wrap event
                    var event = new MouseEvent(type);
                    event.initFromNativeEvent(domEvent);
                    event.bubbles = true;
                    // event.cancelable = eventInfo.cancelable; (NYI)

                    // inner dispatch
                    Input._dispatchEvent(event, scope);

                    // update dom event

                    // Prevent simulated mouse events from firing by browser,
                    // However, this also prevents any default browser behavior from firing (clicks, scrolling, etc)
                    domEvent.preventDefault();
                    if (event._propagationStopped) {
                        if (event._propagationImmediateStopped) {
                            domEvent.stopImmediatePropagation();
                        }
                        else {
                            domEvent.stopPropagation();
                        }
                    }
                };
            }
            else {
                return function (domEvent) {
                    domEvent.preventDefault();
                };
            }
        }
        var SimulateInfos = {
            touchstart: {
                simulateType: 'mousedown'
            },
            touchend: {
                simulateType: 'mouseup'
            },
            touchmove: {
                simulateType: 'mousemove'
            },
            touchcancel: {
                simulateType: ''
            }
        };
        for (var srcType in SimulateInfos) {
            var info = SimulateInfos[srcType];
            this.eventRegister.addEventListener(srcType, getTouchListener(info), true);
        }
    };

    InputContext.prototype.destruct = function () {
        this.eventRegister.removeAll();
    };

    InputContext.prototype.onDomInputEvent = function (domEvent) {
        // wrap event
        var eventInfo = EventRegister.inputEvents[domEvent.type];
        var event = new eventInfo.constructor(domEvent.type);
        event.initFromNativeEvent(domEvent);
        event.bubbles = eventInfo.bubbles;
        // event.cancelable = eventInfo.cancelable; (NYI)

        // inner dispatch
        Input._dispatchEvent(event, this);

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
