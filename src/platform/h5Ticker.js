if (FIRE.isWeb) {

    var Ticker = (function () {
        var Ticker = {};

        var _frameRate = 60;

        // Ticker.requestAnimationFrame

        window.requestAnimationFrame = window.requestAnimationFrame ||
                                       window.mozRequestAnimationFrame ||
                                       window.webkitRequestAnimationFrame ||
                                       window.msRequestAnimationFrame ||
                                       window.oRequestAnimationFrame;
        if (_frameRate !== 60 || !window.requestAnimationFrame) {
            Ticker.requestAnimationFrame = function (callback) {
                return window.setTimeout(callback, 1000 / _frameRate);
            };
        }
        else {
            Ticker.requestAnimationFrame = function (callback) {
                return window.requestAnimationFrame(callback);
            };
        }
        //window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || window.oCancelAnimationFrame;

        // Ticker.now

        if (window.performance && window.performance.now) {
            Ticker.now = function () {
                return window.performance.now() / 1000;
            };
        }
        else {
            Ticker.now = function () {
                return Date.now() / 1000;
            };
        }

        return Ticker;
    })();

    FIRE.__TESTONLY__.Ticker = Ticker;
}
