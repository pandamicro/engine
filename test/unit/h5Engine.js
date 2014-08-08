module('h5Ticker');

var Ticker = FIRE.__TESTONLY__.Ticker;

asyncTest('test now', function() {
    ok(typeof Ticker.now() === 'number');
    ok(Ticker.now() >= 0);

    var startTime = Ticker.now();
    setTimeout(function () {
        var delta = Ticker.now() - startTime;
        ok(0 < delta && delta < 0.03, 'elpased time should in range (0, 0.03): ' + delta);
        start();
    }, 10);
});

asyncTest('test requestAnimationFrame', function() {
    var startTime = Ticker.now();
    var tolerance = 0.02;

    Ticker.requestAnimationFrame(function () {
        var delta = Ticker.now() - startTime;
        ok(0 <= delta && delta < (1 / 60) + tolerance, 'time to next frame should less than 0.016: ' + delta);

        startTime = Ticker.now();
        Ticker.requestAnimationFrame(function () {
            delta = Ticker.now() - startTime;
            close(delta, (1 / 60), tolerance, 'delta time per frame should equals 0.016');
            start();
        });
    });
});

module('h5Engine');

