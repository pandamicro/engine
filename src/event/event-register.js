var EventRegister = {
    inputEvents: {
        // ref: http://www.w3.org/TR/DOM-Level-3-Events/#event-types-list
        'keydown': {
            constructor: KeyboardEvent,
            bubbles: true,
            cancelable: true,
        },
        'keyup': {
            constructor: KeyboardEvent,
            bubbles: true,
            cancelable: true,
        },
        'click': {
            constructor: MouseEvent,
            bubbles: true,
            cancelable: true,
        },
        'dblclick': {
            constructor: MouseEvent,
            bubbles: true,
            cancelable: false,
        },
        'mousedown': {
            constructor: MouseEvent,
            bubbles: true,
            cancelable: true,
        },
        'mouseup': {
            constructor: MouseEvent,
            bubbles: true,
            cancelable: true,
        },
        'mousemove': {
            constructor: MouseEvent,
            bubbles: true,
            cancelable: true,
        },
        //'mouseenter': {
        //    constructor: MouseEvent,
        //    bubbles: false,
        //    cancelable: false,
        //},
        //'mouseleave': {
        //    constructor: MouseEvent,
        //    bubbles: false,
        //    cancelable: false,
        //},
        //'mouseout': {
        //    constructor: MouseEvent,
        //    bubbles: true,
        //    cancelable: true,
        //},
        //'mouseover': {
        //    constructor: MouseEvent,
        //    bubbles: true,
        //    cancelable: true,
        //},
    }
};

Fire.EventRegister = EventRegister;
