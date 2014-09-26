module('time');

var Time = Fire.Time;
var tolerance = 0.000001;

test('test restart', function() {
    var now = 321;
    Time._restart(now);
    strictEqual(Time.time, 0, 'reset time');
    strictEqual(Time.realTime, 0, 'reset realTime');
    strictEqual(Time.frameCount, 0, 'reset frameCount');
});

test('test update', function() {
    Time.maxDeltaTime = 0.2;
    var startTime = 321;
    var now = startTime;
    Time._restart(now);


    now += 0.01;
    Time._update(now);
    close(Time.time, 0.01, tolerance, 'time should equals elapsed time since restart 1');
    close(Time.realTime, now - startTime, tolerance, 'realTime should equals elapsed time since restart 1');
    close(Time.frameCount, 1, tolerance, 'frameCount should equals update count 1');

    now += 0.01;
    Time._update(now);
    close(Time.deltaTime, 0.01, tolerance, 'deltaTime should equals 0.01');
    close(Time.time, 0.02, tolerance, 'time should equals elapsed time since restart 2');
    close(Time.realTime, now - startTime, tolerance, 'realTime should equals elapsed time since restart 2');
    close(Time.frameCount, 2, tolerance, 'frameCount should equals update count 2');

    now += 0.5;
    Time._update(now);
    close(Time.deltaTime, Time.maxDeltaTime, tolerance, 'deltaTime should less equals maxDeltaTime');
    var expectedTime = now - startTime - 0.5 + Time.maxDeltaTime;
    close(Time.time, expectedTime, tolerance, 'time should lag because of limitation by maxDeltaTime');
    close(Time.realTime, now - startTime, tolerance, 'realTime should equals elapsed time since restart 3');
    close(Time.frameCount, 3, tolerance, 'frameCount should equals update count 2');
});
