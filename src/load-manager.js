
/**
 * The manager scheduling resources loading
 * - It will:
 *   - merge same url request
 *   - limit the max concurrent request
 * - It will NOT:
 *   - cache what has being loaded
 *   - load depends of resource
 */
var LoadManager = (function () {

    var urlToCallbacks = new Fire.CallbacksInvoker();

    /**
     * list of elements to load, the element type is {
     *     url: url,
     *     loader: loader,
     *     callback: callback,
     * }
     */
    var loadQueue = [];

    var loadNext = function () {
        if (LoadManager._curConcurrent >= LoadManager.maxConcurrent) {
            Fire.error('too many concurrent requests');
            return;
        }
        var nextOne = loadQueue.pop();
        if (nextOne) {
            doLoad(nextOne.loader, nextOne.url, nextOne.callback);
        }
    };

    function doLoad (loader, url, callback) {
        LoadManager._curConcurrent += 1;
        loader(url, function doLoadCB (asset, error) {
            callback(asset, error);
            LoadManager._curConcurrent = Math.max(0, LoadManager._curConcurrent - 1);
            loadNext();
        });
    }

    var LoadManager = {

        /**
         * Max allowed concurrent request count
         * @property {number} LoadManager.maxConcurrent
         */
        maxConcurrent: 2,

        /**
         * Current concurrent request count
         * @property {number} LoadManager._curConcurrent
         * @private
         */
        _curConcurrent: 0,

        /**
         * NOTE: Request the same url with different loader for same url is not allowed
         */
        load: function (loader, url, callback) {
            if (urlToCallbacks.add(url, callback)) {
                var callbackBundle = urlToCallbacks.bindKey(url, true);
                if (this._curConcurrent < this.maxConcurrent) {
                    doLoad(loader, url, callbackBundle);
                }
                else {
                    loadQueue.push({
                        url: url,
                        loader: loader,
                        callback: callbackBundle,
                    });
                }
            }
        },
    };

    return LoadManager;
})();

__TESTONLY__.LoadManager = LoadManager;
