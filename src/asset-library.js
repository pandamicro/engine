// A asset library which managing loading/unloading assets in project

var AssetLibrary = (function () {

    // configs

    /**
     * 当uuid不在_uuidToUrl里面，则将uuid本身作为url加载，路径位于_libraryBase。
     */
    var _libraryBase = '';

    // variables

    /**
     * the loading uuid's callbacks
     */
    var _uuidToCallbacks = new Fire.CallbacksInvoker();

    // publics

    var AssetLibrary = {

        /**
         * uuid加载流程：
         * 1. 查找_uuidToAsset，如果已经加载过，直接返回
         * 2. 查找_uuidToCallbacks，如果已经在加载，则注册回调，直接返回
         * 4. 如果没有url，则将uuid直接作为路径
         * 5. 递归加载Asset及其引用到的其它Asset
         *
         * @param {string} uuid
         * @param {AssetLibrary~loadCallback} [callback] - the callback to receive the asset
         * @param {boolean} [dontCache=false] - If false, the result will cache to AssetLibrary, and MUST be unload by user manually.
         * @param {Fire._DeserializeInfo} [info] - reused temp obj
         * @param {Fire.Asset} [existingAsset] - load to existing asset in editor
         * NOTE: loadAssetByUuid will always try to get the cached asset, unless existingAsset is supplied.
         */
        _loadAssetByUuid: function (uuid, callback, dontCache, info, existingAsset) {
            dontCache = (typeof dontCache !== 'undefined') ? dontCache : false;
            if (typeof uuid !== 'string') {
                callback('[AssetLibrary] uuid must be string', null);
                return;
            }
            // step 1
            if ( !existingAsset ) {
                var asset = AssetLibrary._uuidToAsset[uuid];
                if (asset) {
                    if (callback) {
                        callback(null, asset);
                    }
                    return;
                }
            }

            // step 2
            // 如果必须重新加载，则不能合并到到 _uuidToCallbacks，否则现有的加载成功后会同时触发回调，
            // 导致提前返回的之前的资源。
            var canShareLoadingTask = !dontCache && !existingAsset;
            if ( canShareLoadingTask && !_uuidToCallbacks.add(uuid, callback) ) {
                // already loading
                return;
            }

            // step 4
            var url = _libraryBase + uuid.substring(0, 2) + Fire.Path.sep + uuid;

            // step 5
            LoadManager.loadByLoader(JsonLoader, url,
                function (error, json) {
                    function onDeserializedWithDepends (err, asset) {
                        if (asset) {
                            asset._uuid = uuid;
                            if ( !dontCache ) {
                                AssetLibrary._uuidToAsset[uuid] = asset;
                            }
                        }
                        if ( canShareLoadingTask ) {
                            _uuidToCallbacks.invokeAndRemove(uuid, err, asset);
                        }
                        else {
                            callback(err, asset);
                        }
                    }
                    if (json) {
                        AssetLibrary.loadJson(json, url, onDeserializedWithDepends, dontCache, info, existingAsset);
                    }
                    else {
                        onDeserializedWithDepends(error, null);
                    }
                }
            );
        },

        /**
         * @param {string|object} json
         * @param {string} url
         * @param {function} callback
         * @param {boolean} [dontCache=false] - If false, the result will cache to AssetLibrary, and MUST be unload by user manually.
         * NOTE: loadAssetByUuid will always try to get the cached asset, no matter whether dontCache is indicated.
         * @param {Fire._DeserializeInfo} [info] - reused temp obj
         * @param {Fire.Asset} [existingAsset] - existing asset to reload
         */
        loadJson: function (json, url, callback, dontCache, info, existingAsset) {
            // prepare
            if (info) {
                // info我们只是用来重用临时对象，所以每次使用前要重设。
                info.reset();
            }
            else {
                info = new Fire._DeserializeInfo();
            }

            // deserialize asset
            Engine._canModifyCurrentScene = false;
            var isScene = json && json[0] && json[0].__type__ === JS._getClassId(Scene);
            var asset = Fire.deserialize(json, info, {
                classFinder: isScene ? Fire._MissingScript.safeFindClass : function (id) {
                    var cls = JS._getClassById(id);
                    if (cls) {
                        return cls;
                    }
                    Fire.warn('Can not get class "%s"', id);
                    return Object;
                },
                target: existingAsset
            });
            Engine._canModifyCurrentScene = true;

            // load depends
            var pendingCount = info.uuidList.length;

            // load raw
            var rawProp = info.rawProp;     // info只能在当帧使用，不能用在回调里！
            if (rawProp) {
                // load depends raw objects
                var attrs = Fire.attr(asset.constructor, info.rawProp);
                var rawType = attrs.rawType;
                ++pendingCount;
                LoadManager.load(url, rawType, asset._rawext, function onRawObjLoaded (error, raw) {
                    if (error) {
                        Fire.error('[AssetLibrary] Failed to load %s of %s. %s', rawType, url, error);
                    }
                    asset[rawProp] = raw;
                    --pendingCount;
                    if (pendingCount === 0) {
                        callback(null, asset);
                    }
                });
            }

            if (pendingCount === 0) {
                callback(null, asset);
            }

            /*
             如果依赖的所有资源都要重新下载，批量操作时将会导致同时执行多次重复下载。优化方法是增加一全局事件队列，
             队列保存每个任务的注册，启动，结束事件，任务从注册到启动要延迟几帧，每个任务都存有父任务。
             这样通过队列的事件序列就能做到合并批量任务。
             如果依赖的资源不重新下载也行，但要判断是否刚好在下载过程中，如果是的话必须等待下载完成才能结束本资源的加载，
             否则外部获取到的依赖资源就会是旧的。
             */

            // @ifdef EDITOR
            // AssetLibrary._loadAssetByUuid 的回调有可能在当帧也可能延后执行，这里要判断是否由它调用 callback，
            // 否则 callback 可能会重复调用
            var invokeCbByDepends = false;
            // @endif

            // load depends assets
            for (var i = 0, len = info.uuidList.length; i < len; i++) {
                var dependsUuid = info.uuidList[i];
                // @ifdef EDITOR
                if (existingAsset) {
                    var existingDepends = info.uuidObjList[i][info.uuidPropList[i]];
                    if (existingDepends) {
                        var dependsUrl = _libraryBase + dependsUuid.substring(0, 2) + Fire.Path.sep + dependsUuid;
                        if ( !LoadManager.isLoading(dependsUrl, true) ) {
                            // 如果有依赖但依赖不在加载过程中就直接略过
                            --pendingCount;
                        }
                        else {
                            // 等待依赖加载完成
                            (function (dependsUrl) {
                                var idToClear = setInterval(function () {
                                    if ( !LoadManager.isLoading(dependsUrl, true) ) {
                                        clearInterval(idToClear);
                                        --pendingCount;
                                        if (pendingCount === 0) {
                                            callback(null, asset);
                                        }
                                    }
                                }, 10);
                            })(dependsUrl);
                        }
                        continue;
                    }
                }
                else {
                    invokeCbByDepends = true;
                }
                // @endif
                var onDependsAssetLoaded = (function (dependsUuid, obj, prop) {
                    // create closure manually because its extremely faster than bind
                    return function (error, dependsAsset) {
                        if (error) {
                            // @ifdef EDITOR
                            if (Fire.AssetDB && Fire.AssetDB.isValidUuid(dependsUuid)) {
                                Fire.error('[AssetLibrary] Failed to load "%s", %s', dependsUuid, error);
                            }
                            // @endif
                        }
                        else {
                            dependsAsset._uuid = dependsUuid;
                        }
                        // update reference
                        obj[prop] = dependsAsset;
                        // check all finished
                        --pendingCount;
                        if (pendingCount === 0) {
                            callback(null, asset);
                        }
                    };
                })( dependsUuid, info.uuidObjList[i], info.uuidPropList[i] );
                AssetLibrary._loadAssetByUuid(dependsUuid, onDependsAssetLoaded, dontCache, info);
            }

            // @ifdef EDITOR
            if ( !invokeCbByDepends && pendingCount === 0) {
                callback(null, asset);
            }
            // @endif
        },

        /**
         * Just the same as _loadAssetByUuid, but will not cache the asset.
         */
        loadAsset: function (uuid, callback) {
            this._loadAssetByUuid(uuid, callback, true, null);
        },

        /**
         * Get the exists asset by uuid.
         *
         * @param {string} uuid
         * @return {Fire.Asset} - the existing asset, if not loaded, just returns null.
         */
        getAssetByUuid: function (uuid) {
            return AssetLibrary._uuidToAsset[uuid] || null;
        },

        //loadAssetByUrl: function (url, callback, info) {},

        /**
         * @callback AssetLibrary~loadCallback
         * @param {Fire.Asset} asset - if failed, asset will be null
         * @param {string} [error] - error info, if succeed, error will be empty or nil
         */

        /**
         * Kill references to the asset so it can be garbage collected.
         * Fireball will reload the asset from disk or remote if loadAssetByUuid being called again.
         * This function will be called if the Asset was destroyed.
         * 如果还有地方引用到asset，除非destroyAsset为true，否则不应该执行这个方法，因为那样可能会导致 asset 被多次创建。
         *
         * @method Fire.AssetLibrary.unloadAsset
         * @param {Fire.Asset|string} assetOrUuid
         * @param {boolean} [destroyImmediate=false] - When destroyAsset is true, if there are objects
         *                                         referencing the asset, the references will become invalid.
         */
        unloadAsset: function (assetOrUuid, destroyImmediate) {
            var asset;
            if (typeof assetOrUuid === 'string') {
                asset = AssetLibrary._uuidToAsset[assetOrUuid];
            }
            else {
                asset = assetOrUuid;
            }
            if (asset) {
                if (destroyImmediate && asset.isValid) {
                    asset.destroy();
                    // simulate destroy immediate
                    FObject._deferredDestroy();
                }
                delete AssetLibrary._uuidToAsset[asset._uuid];
            }
        },

        /**
         * init the asset library
         * @method Fire.AssetLibrary.init
         * @param {string} baseUrl
         * @param {object} [uuidToUrl]
         * @private
         */
        init: function (libraryPath) {
// @ifdef EDITOR
            if (_libraryBase && !Fire.isUnitTest) {
                Fire.error('AssetLibrary has already been initialized!');
                return;
            }
// @endif
            _libraryBase = Fire.Path.setEndWithSep(libraryPath);
            //Fire.log('[AssetLibrary] library: ' + _libraryBase);
        }

        ///**
        // * temporary flag for deserializing assets
        // * @property {boolean} Fire.AssetLibrary.isLoadingAsset
        // */
        //isLoadingAsset: false,
    };

    // unload asset if it is destoryed

    /**
     * uuid to all loaded assets
     *
     * 这里保存所有已经加载的资源，防止同一个资源在内存中加载出多份拷贝。
     * 由于弱引用尚未标准化，在浏览器中所有加载过的资源都只能手工调用 unloadAsset 释放。
     * 参考：
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
     * https://github.com/TooTallNate/node-weak
     */
    AssetLibrary._uuidToAsset = {};

    // @ifdef DEV
    if (Asset.prototype._onPreDestroy) {
        Fire.error('_onPreDestroy of Asset has already defined');
    }
    // @endif
    Asset.prototype._onPreDestroy = function () {
        if (AssetLibrary._uuidToAsset[this._uuid] === this) {
            AssetLibrary.unloadAsset(this, false);
        }
    };

    return AssetLibrary;
})();

Fire.AssetLibrary = AssetLibrary;
