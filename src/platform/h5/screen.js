
var Screen = {
    // The device's pixel ratio (for retina displays)
    devicePixelRatio: (Fire.isRetinaEnabled && window.devicePixelRatio) || 1
};

Object.defineProperty(Screen, 'size', {
    get: function () {
        return Engine._renderContext.size;//.div(this.devicePixelRatio);
    },
    set: function (value) {
        Engine._renderContext.size = value;//.mul(this.devicePixelRatio);
    }
});

//Object.defineProperty(Screen, 'deviceSize', {
//    get: function () {
//        return Engine._renderContext.size;
//    },
//    set: function (value) {
//        Engine._renderContext.size = value;
//        //if ( !isPlaying ) {
//        //    render();
//        //}
//    }
//});

Object.defineProperty(Screen, 'width', {
    get: function () {
        return Engine._renderContext.width;
    },
    set: function (value) {
        Engine._renderContext.width = value;
    }
});

Object.defineProperty(Screen, 'height', {
    get: function () {
        return Engine._renderContext.height;
    },
    set: function (value) {
        Engine._renderContext.height = value;
    }
});



Object.defineProperty(Screen, '_container', {
    get: function () {
        var canvas = Fire.Engine._renderContext.canvas;
        return canvas.parentNode;
    }
});

Object.defineProperty(Screen, '_frame', {
    get: function () {
        var container = this._container;
        return (container.parentNode === document.body) ? document.documentElement : container.parentNode;
    }
});

// Size of parent node that contains container and _canvas
Object.defineProperty(Screen, '_frameSize', {
    get: function () {
        var frame = this._frame;
        return Fire.v2(BrowserGetter.availWidth(frame), BrowserGetter.availHeight(frame));
    }
});

//Object.defineProperty(Screen, 'resolutionPolicy', {
//    get: function () {
//        return this._resolutionPolicy;
//    },
//    set: function (value) {
//        this._resolutionPolicy = value;
//    }
//});

Fire.Screen = Screen;
