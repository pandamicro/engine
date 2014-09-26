
/**
 * The manager scheduling resources loading
 * - It will:
 *   - merge same url request
 *   - limit the max concurrent request (NYI)
 * - It will NOT:
 *   - cache what has being loaded
 *   - load depends of resource
 */
var LoadManager = (function () {

    var urlToCallbacks = new Fire.CallbacksInvoker();
    //var curConcurrent = 0;

    //var loadNext = function () {
    //    if (curConcurrent < LoadManager.maxConcurrent) {
    //        ++curConcurrent;
    //    }
    //};

    var LoadManager = {
        
        //maxConcurrent: 10,

        load: function (loader, url, callback) {
            // TODO: what if same url use difference loader ?
            if (urlToCallbacks.add(url, callback)) {
                // download
                loader(url, urlToCallbacks.bind(url, true));
                //loadNext();
            }
        },
    };

    return LoadManager;
})();
