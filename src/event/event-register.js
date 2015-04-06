var FireMouseEvent = Fire.MouseEvent;
var FireKeyboardEvent = Fire.KeyboardEvent;

var EventRegister = {
    inputEvents: {
        // ref: http://www.w3.org/TR/DOM-Level-3-Events/#event-types-list
        keydown: {
            constructor: FireKeyboardEvent,
            bubbles: true,
            cancelable: true
        },
        keyup: {
            constructor: FireKeyboardEvent,
            bubbles: true,
            cancelable: true
        },
        click: {
            constructor: FireMouseEvent,
            bubbles: true,
            cancelable: true
        },
        dblclick: {
            constructor: FireMouseEvent,
            bubbles: true,
            cancelable: false
        },
        mousedown: {
            constructor: FireMouseEvent,
            bubbles: true,
            cancelable: true
        },
        mouseup: {
            constructor: FireMouseEvent,
            bubbles: true,
            cancelable: true
        },
        mousemove: {
            constructor: FireMouseEvent,
            bubbles: true,
            cancelable: true
        },
        //touchstart: {
        //    constructor: FireMouseEvent,
        //    bubbles: true,
        //    cancelable: true
        //},
        //touchend: {
        //    constructor: FireMouseEvent,
        //    bubbles: true,
        //    cancelable: true
        //},
        //touchmove: {
        //    constructor: FireMouseEvent,
        //    bubbles: true,
        //    cancelable: true
        //}
        //mouseenter: {
        //    constructor: FireMouseEvent,
        //    bubbles: false,
        //    cancelable: false,
        //},
        //mouseleave: {
        //    constructor: FireMouseEvent,
        //    bubbles: false,
        //    cancelable: false,
        //},
        //mouseout: {
        //    constructor: FireMouseEvent,
        //    bubbles: true,
        //    cancelable: true,
        //},
        //mouseover: {
        //    constructor: FireMouseEvent,
        //    bubbles: true,
        //    cancelable: true,
        //},
    }
};

Fire.EventRegister = EventRegister;
