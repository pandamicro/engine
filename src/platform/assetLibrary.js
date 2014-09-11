// A asset library which managing loading/unloading assets in project

var AssetLibrary = (function () {

    /**
     * uuid to all loaded assets
     * 
     * 这里保存所有已经加载的资源，防止同一个资源在内存中加载出多份拷贝。
     * 由于弱引用尚未标准化，在浏览器中所有加载过的资源都只能手工调用 unloadAsset 释放。
     * 参考：
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
     * https://github.com/TooTallNate/node-weak
     */
    var _uuidToAsset = {};

    /**
     * uuid to urls
     * 
     * 如果uuid能映射到url则优先从url加载，否则从library加载。这个步骤在最终发布版本中应该是不需要的？
     */
    var _uuidToUrl = {};

    /**
     * 当uuid不在_uuidToUrl里面，则将uuid本身作为url加载，路径位于_libraryBase。
     */
    var _libraryBase = '';

    var AssetLibrary = {

        /**
         * uuid加载流程：
         * 1. 查找_uuidToAsset，如果已经加载过，直接返回
         * 2. 查找_uuidToUrl，如果有则从指定url加载，这一步方便引擎单独测试
         * // 3. 如果没有，尝试向编辑器请求url
         * 4. 如果没有url，则将uuid直接作为路径加载
         * 
         * @param {string} uuid
         * @param {AssetLibrary~loadCallback} [callback] - the callback to receive the asset
         * @param {FIRE._LoadingContext} [context] - the loading context info
         */
        loadAssetByUuid: function (uuid, callback, context) {
            // step 1
            var asset = _uuidToAsset[uuid];
            if (asset) {
                if (callback) {
                    callback(asset);
                }
                return null;
            }

            // step 2
            var url = _uuidToUrl && _uuidToUrl[uuid];

            //// step 3
            //if (!url && AssetDB) {
            //    url = AssetDB.uuidToFsysPath(uuid);
            //}

            // step 4
            if (!url) {
                url = _libraryBase + uuid;
            }
            context = context || new FIRE._LoadingContext();
            _doLoad(url, context, callback);
        },

        /**
         * @callback AssetLibrary~loadCallback
         * @param {FIRE.Asset} asset - if failed, asset will be null
         * @param {string} [error] - error info, if succeed, error will be empty or nil
         */

        /**
         * Kill references to the asset so it can be garbage collected.
         * Fireball will reload the asset from disk or remote if loadAssetByUuid being called again.
         * 如果还有地方引用到asset，除非destroyAsset为true，否则不应该执行这个方法。
         * 
         * @method FIRE.AssetLibrary.unloadAsset
         * @param {FIRE.Asset} asset
         * @param {boolean} [destroyAsset=false] - When destroyAsset is true, if there are objects 
         *                                         referencing the asset, the references will become invalid.
         */
        unloadAsset: function (asset, destroyAsset) {
            if (!asset) {
                console.error('AssetLibrary.unloadAsset: asset must be non-nil');
                return;
            }
            if (destroyAsset && asset.isValid) {
                asset.destroy();
            }
            delete _uuidToAsset[asset._uuid];
        },

        /**
         * 
         * @method FIRE.AssetLibrary.init
         * @param {string} baseUrl
         * @param {object} [uuidToUrl]
         */
        init: function (libraryPath, uuidToUrl) {
            // this.baseUrl = baseUrl;
            // console.log('AssetLibrary: assets: ' + baseUrl);

            _libraryBase = libraryPath;
            console.log('[AssetLibrary] library: ' + _libraryBase);
            _libraryBase += FIRE.Path.sep;

            _uuidToUrl = uuidToUrl;
        },

        /**
         * Contains the url to the asset database folder (read only).
         * The value depends on which platform you are running on:
         * Web: <project folder>/assets
         * Fireball Editor: <project folder>/assets
         * 
         * @property {string} FIRE.AssetLibrary.baseUrl
         */
        // baseUrl: '',
    };

    var _doLoad = function (url, callback, context) {
        LoadManager.Load(TextLoader, url,
            function (json) {
                var data = FIRE.deserialize(json);
                _uuidToAsset[uuid] = data.mainData;
                if (callback) {
                    callback(asset);
                }
            }, 
            function (error) {
                var loading = context.uuidLoaded;
            });
    };

    return AssetLibrary;
})();

FIRE.AssetLibrary = AssetLibrary;
