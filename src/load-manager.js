
/**
 * The manager scheduling resources loading
 * - It will:
 *   - select registered loader
 *   - merge same url request
 *   - limit the max concurrent request
 * - It will NOT:
 *   - cache what has being loaded
 *   - load depends of resource
 */
var LoadManager = (function () {

    function getBuiltinRawTypes () {
        return {
            image: {
                loader: ImageLoader,
                defaultExtname: '.host',
            },
            json: {
                loader: JsonLoader,
                defaultExtname: '.json',
            },
            text: {
                loader: TextLoader,
                defaultExtname: '.txt',
            },
            audio: {
                loader: Fire.AudioClipLoader,
                defaultExtname: '',
            },
        };
    }

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
        loadByLoader: function (loader, url, callback) {
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

        /**
         * @param {string} url
         * @param {string} rawType
         * @param {string} [rawExtname]
         * @param {function} callback
         */
        load: function (url, rawType, rawExtname, callback) {
            if (typeof rawExtname === 'function') {
                callback = rawExtname;
            }
            var typeInfo = this._rawTypes[rawType];
            if (typeInfo) {
                var extname = rawExtname ? ('.' + rawExtname) : typeInfo.defaultExtname;
                if (extname) {
                    var rawUrl = url + extname;
                    this.loadByLoader(typeInfo.loader, rawUrl, callback);
                }
                else {
                    callback(null, 'Undefined extname for the raw ' + rawType + ' file of ' + url);
                }
            }
            else {
                callback(null, 'Unknown raw type "' + rawType + '" of ' + url);
            }
        },

        _rawTypes: getBuiltinRawTypes(),

        /**
         * @param {string} rawType
         * @param {function} loader
         * @param {string} defaultExtname
         */
        registerRawTypes: function (rawType, loader, defaultExtname) {
// @ifdef DEV
            if (!rawType) {
                Fire.error('[AssetLibrary.registerRawTypes] rawType must be non-nil');
                return;
            }
            if (typeof rawType !== 'string') {
                Fire.error('[AssetLibrary.registerRawTypes] rawType must be string');
                return;
            }
            if (!loader) {
                Fire.error('[AssetLibrary.registerRawTypes] loader must be non-nil');
                return;
            }
            if (typeof loader !== 'function') {
                Fire.error('[AssetLibrary.registerRawTypes] loader must be function');
                return;
            }
// @endif
            if (this._rawTypes[rawType]) {
                Fire.error('rawType "%s" has already defined', rawType);
                return;
            }
            if (defaultExtname && defaultExtname[0] !== '.') {
                defaultExtname = '.' + defaultExtname;
            }
            this._rawTypes[rawType] = {
                loader: loader,
                defaultExtname: defaultExtname,
            };
        },

// @ifdef EDITOR
        reset: function () {
            this._rawTypes = getBuiltinRawTypes();
        },
// @endif

        _loadFromXHR: _LoadFromXHR,
    };

    return LoadManager;
})();

Fire.LoadManager = LoadManager;
