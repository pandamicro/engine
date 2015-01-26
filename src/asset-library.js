// A asset library which managing loading/unloading assets in project

var AssetLibrary = (function () {

    var RawTypes = {
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
    };

    // configs

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

    // variables

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
     * the loading uuid's callbacks
     */
    var _uuidToCallbacks = new Fire.CallbacksInvoker();

    // publics

    var AssetLibrary = {

        /**
         * uuid加载流程：
         * 1. 查找_uuidToAsset，如果已经加载过，直接返回
         * 2. 查找_uuidToCallbacks，如果已经在加载，则注册回调，直接返回
         * 3. 查找_uuidToUrl，如果有则从指定url加载，这一步方便引擎单独测试
         * 4. 如果没有url，则将uuid直接作为路径
         * 5. 递归加载Asset及其引用到的其它Asset
         *
         * @param {string} uuid
         * @param {AssetLibrary~loadCallback} [callback] - the callback to receive the asset
         * @param {boolean} [dontCache=false] - If false, the result will cache to AssetLibrary, and MUST be unload by user manually.
         * NOTE: loadAssetByUuid will always try to get the cached asset, no matter whether dontCache is indicated.
         * @param {Fire._DeserializeInfo} [info] - reused temp obj
         */
        _loadAssetByUuid: function (uuid, callback, dontCache, info) {
            dontCache = (typeof dontCache !== 'undefined') ? dontCache : false;
            if (typeof uuid !== 'string') {
                callback(null, '[AssetLibrary] uuid must be string');
                return;
            }
            // step 1
            var asset = _uuidToAsset[uuid];
            if (asset) {
                if (callback) {
                    callback(asset);
                }
                return;
            }

            // step 2
            if (_uuidToCallbacks.add(uuid, callback) === false) {
                // already loading
                return;
            }

            // step 3
            var url = _uuidToUrl && _uuidToUrl[uuid];

            // step 4
            if (!url) {
                url = _libraryBase + uuid.substring(0, 2) + Fire.Path.sep + uuid;
            }

            // step 5
            LoadManager.load(TextLoader, url,
                function (json, error) {
                    if (error) {
                        _uuidToCallbacks.invokeAndRemove(uuid, null, error);
                        return;
                    }
                    AssetLibrary._deserializeWithDepends(json, url, function (asset) {
                        asset._uuid = uuid;
                        if ( !dontCache ) {
                            _uuidToAsset[uuid] = asset;
                        }
                        _uuidToCallbacks.invokeAndRemove(uuid, asset);
                    }, dontCache, info);
                });
            //loadAssetByUrl (url, callback, info);
        },

        /**
         * @param {string|object} json
         * @param {string} url
         * @param {function} callback
         * @param {boolean} [dontCache=false] - If false, the result will cache to AssetLibrary, and MUST be unload by user manually.
         * NOTE: loadAssetByUuid will always try to get the cached asset, no matter whether dontCache is indicated.
         * @param {Fire._DeserializeInfo} [info] - reused temp obj
         */
        _deserializeWithDepends: function (json, url, callback, dontCache, info) {
            // prepare
            if (info) {
                // info我们只是用来重用临时对象，所以每次使用前要重设
                info.reset();
            }
            else {
                info = new Fire._DeserializeInfo();
            }

            // deserialize asset
            Engine._canModifyCurrentScene = false;
            var asset = Fire.deserialize(json, info, {
                classFinder: function (id) {
                    var cls = Fire._getClassById(id);
                    if (cls) {
                        return cls;
                    }
                    Fire.warn('Can not get class "%s"', id);
                    return Object;
                }
            });
            Engine._canModifyCurrentScene = true;

            // load depends
            var pendingCount = info.uuidList.length;

            // load raw
            if (info.rawProp) {
                // load depends raw objects
                var attrs = Fire.attr(asset.constructor, info.rawProp);
                var rawType = attrs.rawType;
                var typeInfo = RawTypes[rawType];
                if (typeInfo) {
                    ++pendingCount;
                    var extname = asset._rawext ? ('.' + asset._rawext) : typeInfo.defaultExtname;
                    var rawUrl = url + extname;
                    LoadManager.load(typeInfo.loader, rawUrl, function onRawRawObjLoaded (raw, error) {
                        if (error) {
                            Fire.error('[AssetLibrary] Failed to load %s of %s. %s', rawType, url, error);
                        }
                        asset[info.rawProp] = raw;
                        --pendingCount;
                        if (pendingCount === 0) {
                            callback(asset);
                        }
                    });
                }
                else {
                    Fire.warn('[AssetLibrary] Unknown raw type "%s" of %s', rawType, url);
                }
            }
            if (pendingCount === 0) {
                callback(asset);
                return;
            }

            // load depends assets
            for (var i = 0, len = info.uuidList.length; i < len; i++) {
                var dependsUuid = info.uuidList[i];
                var onDependsAssetLoaded = (function (dependsUuid, obj, prop) {
                    // create closure manually because its extremely faster than bind
                    return function (dependsAsset, error) {
                        if (error) {
                            Fire.error('[AssetLibrary] Failed to load "' + dependsUuid + '", ' + error);
                        }
                        // update reference
                        obj[prop] = dependsAsset;
                        // check all finished
                        --pendingCount;
                        if (pendingCount === 0) {
                            callback(asset);
                        }
                    };
                })( dependsUuid, info.uuidObjList[i], info.uuidPropList[i] );
                AssetLibrary._loadAssetByUuid(dependsUuid, onDependsAssetLoaded, dontCache, info);
            }
        },

        /**
         * Just the same as _loadAssetByUuid, but will not cache the asset.
         */
        loadAsset: function (uuid, callback) {
            this._loadAssetByUuid(uuid, callback, true, null);
        },

        // @ifdef EDITOR
        /**
         * @param {object} meta
         */
        loadMeta: function (meta, callback) {
            this._deserializeWithDepends(meta, '', callback, true);
        },
        // @endif

        /**
         * Get the exists asset by uuid.
         *
         * @param {string} uuid
         * @returns {Fire.Asset} - the existing asset, if not loaded, just returns null.
         */
        getAssetByUuid: function (uuid) {
            return _uuidToAsset[uuid] || null;
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
         * @param {boolean} [destroyAsset=false] - When destroyAsset is true, if there are objects
         *                                         referencing the asset, the references will become invalid.
         */
        unloadAsset: function (assetOrUuid, destroyAsset) {
            var asset;
            if (typeof assetOrUuid === 'string') {
                asset = _uuidToAsset[assetOrUuid];
            }
            else {
                asset = assetOrUuid;
            }
            if (asset) {
                if (destroyAsset && asset.isValid) {
                    asset.destroy();
                }
                delete _uuidToAsset[asset._uuid];
            }
        },

        /**
         * init the asset library
         * @method Fire.AssetLibrary.init
         * @param {string} baseUrl
         * @param {object} [uuidToUrl]
         * @private
         */
        init: function (libraryPath, uuidToUrl) {
            _libraryBase = Fire.Path.setEndWithSep(libraryPath);
            //Fire.log('[AssetLibrary] library: ' + _libraryBase);

            _uuidToUrl = uuidToUrl;
        },

        // @ifdef EDITOR

        /**
         * Kill all references to assets so they can be garbage collected.
         * Fireball will reload the asset from disk or remote if loadAssetByUuid being called again.
         * 如果还有地方引用到 asset，调用该方法可能会导致 asset 被多次创建。
         *
         * @private
         */
        clearAllCache: function () {
            _uuidToAsset = {};
        },

        /**
         * @param {Fire.Asset} newAsset
         * @param {string} [uuid]
         */
        replaceAsset: function (newAsset, uuid) {
            uuid = uuid || newAsset._uuid;
            if (uuid) {
                _uuidToAsset[uuid] = newAsset;
            }
            else {
                Fire.error('[AssetLibrary] Not supplied uuid of asset to replace');
            }
        },

        // the asset changed listener
        // 这里的回调需要完全由使用者自己维护，AssetLibrary只负责调用。
        assetListener: new Fire.CallbacksInvoker(),

        _onAssetChanged: function (uuid, asset) {
            this.assetListener.invoke(uuid, asset);
        },

        /**
         * Shadow copy all serializable properties from supplied asset to another indicated by uuid.
         * @param {string} uuid
         * @param {Fire.Asset} newAsset
         */
        _updateAsset: function (uuid, newAsset) {
            var asset = _uuidToAsset[uuid];
            if ( !asset || !newAsset ) {
                return;
            }
            var cls = asset.constructor;
            if (cls !== newAsset.constructor) {
                Fire.error('Not the same type');
                return;
            }
            if (asset.shadowCopyFrom) {
                asset.shadowCopyFrom(newAsset);
            }
            else {
                var props = cls.__props__;
                if (props) {
                    for (var p = 0; p < props.length; p++) {
                        var propName = props[p];
                        var attrs = Fire.attr(cls, propName);
                        if (attrs.serializable !== false) {
                            asset[propName] = newAsset[propName];
                        }
                    }
                }
            }
            this._onAssetChanged(uuid, asset);
        },

        /**
         * In editor, if you load an asset from loadAsset, and then use the asset in the scene,
         * you should call cacheAsset manually to ensure the asset's reference is unique.
         */
        cacheAsset: function (asset) {
            if (asset) {
                if (asset._uuid) {
                    _uuidToAsset[asset._uuid] = asset;
                }
                else {
                    Fire.error('[AssetLibrary] Not defined uuid of the asset to cache');
                }
            }
            else {
                Fire.error('[AssetLibrary] The asset to cache must be non-nil');
            }
        },

        /**
         * If asset is cached, reload and update it.
         * @param {string} uuid
         */
        onAssetReimported: function (uuid) {
            var loaded = _uuidToAsset[uuid];
            if ( !loaded ) {
                return;
            }

            // reload

            delete _uuidToAsset[uuid];  // force reload
            this._loadAssetByUuid(uuid, function (asset) {
                var notUnloaded = uuid in _uuidToAsset;
                if (asset && notUnloaded) {
                    this._updateAsset(uuid, asset);
                }
            }.bind(this));
            // 防止 reload 过程中还有人调用 this.loadAssetByUuid。
            // 我们会保留旧的 asset，因此不允许别的地方获得这个新load进来的 asset 的引用，否则引用不唯一。
            _uuidToAsset[uuid] = loaded;
        },

        // @endif // EDITOR

        ///**
        // * temporary flag for deserializing assets
        // * @property {boolean} Fire.AssetLibrary.isLoadingAsset
        // */
        //isLoadingAsset: false,
    };

    // @ifdef EDITOR
    /**
     * Get the original cached assets (Read Only)
     * This property can only be used for debugging purpose.
     * @private
     */
    Object.defineProperty(AssetLibrary, '_uuidToAsset', {
        get: function () {
            return _uuidToAsset;
        }
    });
    // @endif

    // unload asset if it is destoryed

    // @ifdef DEV
    if (Asset.prototype._onPreDestroy) {
        Fire.error('_onPreDestroy of Asset has already defined');
    }
    // @endif
    Asset.prototype._onPreDestroy = function () {
        if (_uuidToAsset[this._uuid] === this) {
            AssetLibrary.unloadAsset(this, false);
        }
    };

    return AssetLibrary;
})();

Fire.AssetLibrary = AssetLibrary;
