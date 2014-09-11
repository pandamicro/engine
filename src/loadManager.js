
/**
 * The manager scheduling resources loading
 * - It will:
 *   - limit the max concurrent request (NYI)
 *   - merge same url request
 * - It will not:
 *   - cache what has being loaded
 *   - cares about loading context
 */
var LoadManager = (function () {

    var urlToCallbacks = {};
    //var curConcurrent = 0;

    //var loadNext = function () {
    //    if (curConcurrent < LoadManager.maxConcurrent) {
    //        ++curConcurrent;
    //    }
    //};

    var LoadManager = {
        
        //maxConcurrent: 10,

        load: function (loader, url, callback) {
            var callbackList = urlToCallbacks[url];
            if (callbackList) {
                callbackList.push(url);
                // TODO: what if same url use difference loader ?
                return;
            
            }
            urlToCallbacks[url] = [url];
            
            // download
            loader(url,
                function (asset, error) {
                    for (var i = 0; i < callbackList.length; i++) {
                        var cb = callbackList[i];
                        cb(asset, error);
                    }
                    delete urlToCallbacks[url];
                });
            //loadNext();
        },
    };

    return LoadManager;
})();
