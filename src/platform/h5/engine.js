var FIRE = FIRE || {};

FIRE.Engine = (function () {

    var Engine = {};

    var isPlaying = false;

    Engine.__defineGetter__('isPlaying', function () {
        return isPlaying;
    });

    Engine.init = function () {

    };

    Engine.play = function () {
        if (isPlaying) {
            console.log('Fireball is already playing');
            return;
        }
        isPlaying = true;

        var now = Ticker.now();
        FIRE.Time._restart(now);
        Engine.update();
    };

    Engine.stop = function () {
        isPlaying = false;
    };
    
    Engine.pause = function () {
        isPlaying = false;
    };

    Engine.step = function () {
        if (isPlaying) {
            Engine.pause();
        }
        Engine.update(0, true);
    };

    Engine.update = function (unused, stepping) {
        if (!stepping) {
            if (isPlaying === false) {
                return;
            }
            Ticker.requestAnimationFrame.call(window, Engine.update);
        }

        var now = Ticker.now();
        FIRE.Time._update(now);
        console.log(FIRE.Time);
    };

    return Engine;
})();
