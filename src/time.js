var Time = (function () {
    var Time = {};

    Time.time = 0;
    Time.realTime = 0;
    Time.deltaTime = 0;
    Time.frameCount = 0;
    Time.maxDeltaTime = 0.3333333;

    var lastUpdateTime = 0;
    var startTime = 0;

    /**
     * @method Fire.Time._update
     * @param {boolean} [paused=false] if true, only realTime will be updated
     * @private
     */
    Time._update = function (timestamp, paused) {
        if (!paused) {
            var delta = timestamp - lastUpdateTime;
            delta = Math.min(Time.maxDeltaTime, delta);
            lastUpdateTime = timestamp;

            ++Time.frameCount;
            Time.deltaTime = delta;
            Time.time += delta;
        }
        Time.realTime = timestamp - startTime;
    };

    Time._restart = function (timestamp) {
        Time.time = 0;
        Time.realTime = 0;
        Time.deltaTime = 0;
        Time.frameCount = 0;
        lastUpdateTime = timestamp;
        startTime = timestamp;
    };

    return Time;
})();

Fire.Time = Time;
