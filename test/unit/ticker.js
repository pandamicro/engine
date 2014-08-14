module('ticker');

var Ticker = FIRE.__TESTONLY__.Ticker;

asyncTest('test now', function() {
    ok(typeof Ticker.now() === 'number');
    ok(Ticker.now() >= 0);

    var startTime = Ticker.now();
    setTimeout(function () {
        var delta = Ticker.now() - startTime;
        ok(0 < delta && delta < 0.1, 'elpased time should in range (0, 0.1): ' + delta);
        start();
    }, 10);
});

asyncTest('test requestAnimationFrame', function() {
    var startTime = Ticker.now();
    var tolerance = 0.02;

    var requestId = Ticker.requestAnimationFrame(function () {
        var delta = Ticker.now() - startTime;
        ok(0 <= delta && delta < (1 / 60) + tolerance, 'time to next frame should less than 0.016: ' + delta);

        startTime = Ticker.now();
        Ticker.requestAnimationFrame(function () {
            delta = Ticker.now() - startTime;
            close(delta, (1 / 60), tolerance, 'delta time per frame should equals 0.016');
            start();
        });
    });
    strictEqual(typeof requestId, 'number', 'requestAnimationFrame should return a request id');
});

asyncTest('test cancelAnimationFrame', function() {
    expect(0);
    var requestId = Ticker.requestAnimationFrame(function () {
        ok(false, 'should not callback after cancelAnimationFrame');
    });
    Ticker.cancelAnimationFrame(requestId);
    setTimeout(function () {
        start();
    }, 30);
});
