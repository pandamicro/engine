
module('LoadManager', {
    setup: function () {
    }
});

asyncTest('base', function () {
    var dummyAsset = {};

    var myLoader = function (url, callback, onProgress) {
        setTimeout(function () {
            cb.enable();
            callback(dummyAsset);
        }, 1);
    };

    var cb = new Callback(function (asset) {
        strictEqual(asset, dummyAsset, 'should return the right asset');
        clearTimeout(timerId);
        start();
    });

    LoadManager.load(myLoader, '', cb);

    var timerId = setTimeout(function () {
        ok(false, 'time out!');
        start();
    }, 100);
});

asyncTest('Concurrent', function () {
    strictEqual(LoadManager._curConcurrent, 0, 'should finish all tasks');
    LoadManager.maxConcurrent = 1;

    var cb = new Callback().enable();
    var immediateLoader = function (url, callback, onProgress) {
        callback();
    };

    LoadManager.load(immediateLoader, '', cb);
    cb.once('should load immediate if concurrent < max');
    LoadManager.load(immediateLoader, '', cb);
    cb.once('should load immediate again');


    var asyncLoader = function (url, callback, onProgress) {
        setTimeout(function () {
            callback();
        }, 1);
    };

    cb.disable('should wait for first loaded');
    // load first
    LoadManager.load(asyncLoader, '', function () {
        cb.enable();
    });
    cb.callbackFunction(function () {
        clearTimeout(timerId);
        start();
    });
    // deferred load second
    LoadManager.load(asyncLoader, '', cb);
    
    var timerId = setTimeout(function () {
        ok(false, 'time out!');
        start();
    }, 100);
});
