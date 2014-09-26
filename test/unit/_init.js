var FObject = Fire.FObject;
var Asset = Fire.Asset;
var Vec2 = Fire.Vec2;
var Matrix23 = Fire.Matrix23;
var Rect = Fire.Rect;
var Color = Fire.Color;
var Texture = Fire.Texture;
var Sprite = Fire.Sprite;
var Atlas = Fire.Atlas;
var FontInfo = Fire.FontInfo;

var TestOnly = Fire.__TESTONLY__;
var Ticker = TestOnly.Ticker;
var Time = Fire.Time;
var Entity = Fire.Entity;
var Engine = Fire.Engine;
var Camera = Fire.Camera;
var Component = Fire.Component;

var FO = Fire.FObject;
var V2 = Fire.Vec2;
var M3 = Fire.Matrix23;


/**
 * force reset the engine
 */
Engine._reset = function (w, h) {
    if (!Engine.inited) {
        Engine.init(w, h);
    }
    else {
        Engine.screenSize = new V2(w, h);
    }
    Engine._setCurrentScene(new Fire._Scene());

    Engine.stop();
};

var TestEnv = {
    setup: function () {
        TestOnly.update = null;
        Engine._reset(256, 512);
        // check error
        Engine._renderContext.checkMatchCurrentScene(true);
    },
    teardown: function () {
        TestOnly.update = null;
        Engine.stop();
        // check error
        Engine._renderContext.checkMatchCurrentScene(true);
    }
};