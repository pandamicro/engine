
var Engine = (function () {

    var Engine = {
// @ifdef EDITOR
        _editorCallback: editorCallback
// @endif
    };

    var isPlaying = false;
    var isPaused = false;
    var stepOnce = false;
    var isLoadingScene = false;

    // We should use this id to cancel ticker, otherwise if the engine stop and replay immediately,
    // last ticker will not cancel correctly.
    var requestId = -1;

    /**
     * 当前激活的场景，如果为空，一般是因为正在加载场景或Entity(例如执行Fire.deserialize)。
     * 这样是为了防止加载中的东西不小心影响到当前场景。一般代码不用关心这个问题，但大部分构造函数里执行的代码，
     * 如果涉及到场景物件的操作，都要注意这点。
     * 也就是说构造函数调用到的代码如果要操作 Engine._scene，必须判断非空，如果操作不直接针对 Engine._scene，
     * 也判断 Engine._canModifyCurrentScene。
     * 另外，如果存在辅助场景，当在辅助场景内创建物件时，Engine._scene会被临时修改为辅助场景。
     *
     * @property {Scene} Engine._scene - the active scene
     */
    Engine._scene = null;

    // main render context
    Engine._renderContext = null;

    // main interaction context
    Engine._interactionContext = null;

    // the render context currently rendering
    Engine._curRenderContext = null;

    // main input context
    Engine._inputContext = null;

    // is rendering and allow update logic
    Object.defineProperty(Engine, 'isPlaying', {
        get: function () {
            return isPlaying;
        }
    });

    // is logic paused
    Object.defineProperty(Engine, 'isPaused', {
        get: function () {
            return isPaused;
        }
    });

    // is loading scene and its assets asynchronous
    Object.defineProperty(Engine, 'isLoadingScene', {
        get: function () {
            return isLoadingScene;
        }
    });

    var lockingScene = null;

    /**
     * You should check whether you can modify the scene in constructors which may called by the engine while deserializing.
     * 这个属性和 Fire._isCloning 很类似。但这里关注的是场景是否能修改，而 Fire._isCloning 强调的是持有的对象是否需要重新创建。
     * @param {boolean} Engine._canModifyCurrentScene
     * @see Fire._isCloning
     */
    Object.defineProperty(Engine, '_canModifyCurrentScene', {
        get: function () {
            return !lockingScene;
        },
        set: function (value) {
            if (value) {
                // unlock
                this._scene = lockingScene;
                lockingScene = null;
            }
            else {
                // lock
                if (this._scene && lockingScene) {
                    Fire.error('another scene still locked: ' + lockingScene.name);
                }
                lockingScene = this._scene;
                this._scene = null;
            }
        }
    });

    /**
     * @param {Fire.Vec2} value
     * @return {Fire.Vec2}
     */
    Object.defineProperty(Engine, 'screenSize', {
        get: function () {
            return Engine._renderContext.size;
        },
        set: function (value) {
            Engine._renderContext.size = value;
            //if ( !isPlaying ) {
            //    render();
            //}
        }
    });

    var inited = false;
    Object.defineProperty(Engine, 'inited', {
        get: function () {
            return inited;
        }
    });

    /**
     * Scene name to uuid
     * @private
     */
    Engine._sceneInfos = {};

    // functions

    /**
     * @param {number} [w]
     * @param {number} [h]
     * @param {Canvas} [canvas]
     * @param {object} [sceneInfos]
     * @return {RenderContext}
     */
    Engine.init = function ( w, h, canvas, sceneInfos ) {
        if (inited) {
            Fire.error('Engine already inited');
            return;
        }
        inited = true;

        Engine._renderContext = new RenderContext( w, h, canvas );
        Engine._interactionContext = new InteractionContext();

// @ifdef EDITOR
        if (Fire.isEditor === false) {
            // test in other platform
            Engine._scene = new Scene();
            //if (editorCallback.onSceneLoaded) {
            //    editorCallback.onSceneLoaded(Engine._scene);
            //}
            if (editorCallback.onSceneLaunched) {
                editorCallback.onSceneLaunched(Engine._scene);
            }
        }
// @endif

        JS.mixin(Engine._sceneInfos, sceneInfos);

        return Engine._renderContext;
    };

    Engine.play = function () {
        if (isPlaying && !isPaused) {
            Fire.warn('Fireball is already playing');
            return;
        }
        if (isPlaying && isPaused) {
            isPaused = false;
// @ifdef EDITOR
            if (editorCallback.onEnginePlayed) {
                editorCallback.onEnginePlayed(true);
            }
// @endif
            return;
        }
        isPlaying = true;

        Engine._inputContext = new InputContext(Engine._renderContext);
        var now = Ticker.now();
        Time._restart(now);
        update();

// @ifdef EDITOR
        if (editorCallback.onEnginePlayed) {
            editorCallback.onEnginePlayed(false);
        }
// @endif
    };

    Engine.stop = function () {
        if (isPlaying) {
            FObject._deferredDestroy();
            Engine._inputContext.destruct();
            Engine._inputContext = null;
            Input._reset();
        }
        // reset states
        isPlaying = false;
        isPaused = false;
        isLoadingScene = false; // TODO: what if loading scene ?
        if (requestId !== -1) {
            Ticker.cancelAnimationFrame(requestId);
            requestId = -1;
        }

// @ifdef EDITOR
        if (editorCallback.onEngineStopped) {
            editorCallback.onEngineStopped();
        }
// @endif
    };

    Engine.pause = function () {
        isPaused = true;
// @ifdef EDITOR
        if (editorCallback.onEnginePaused) {
            editorCallback.onEnginePaused();
        }
// @endif
    };

    Engine.step = function () {
        this.pause();
        stepOnce = true;
        if ( !isPlaying ) {
            Engine.play();
        }
    };

    function render () {
        // render
        Engine._scene.render(Engine._renderContext);
    }

    function doUpdate (updateLogic) {
        if (Engine._scene) {
            if (updateLogic) {
                Engine._scene.update();
                FObject._deferredDestroy();
            }
            render();

            // update interaction context
            Engine._interactionContext.update(Engine._scene.entities);
        }
    }

    /**
     * @method Fire.Engine.update
     * @param {float} [unused] - not used parameter, can omit
     * @private
     */
    function update (unused) {
        if (!isPlaying) {
            return;
        }
        requestId = Ticker.requestAnimationFrame(update);

        if (isLoadingScene) {
            return;
        }

        var updateLogic = !isPaused || stepOnce;
        stepOnce = false;
        var now = Ticker.now();
        Time._update(now, !updateLogic);
        doUpdate(updateLogic);

// @ifdef DEV
        if (__TESTONLY__.update) {
            __TESTONLY__.update(updateLogic);
        }
// @endif
    }
    Engine.update = update;

    /**
     * Set current scene directly
     * @method Fire.Engine._setCurrentScene
     * @param {Scene} scene
     * @param {function} [onBeforeLoadScene]
     * @private
     */
    Engine._setCurrentScene = function (scene, onBeforeLoadScene) {
        if (!scene) {
            Fire.error('Argument must be non-nil');
            return;
        }

        // TODO: allow dont destroy behaviours
        // unload scene
        var oldScene = Engine._scene;
        if (Fire.isValid(oldScene)) {
            // destroyed and unload
            AssetLibrary.unloadAsset(oldScene, true);
        }

        // purge destroyed entities belongs to old scene
        FObject._deferredDestroy();

        Engine._scene = null;

        if (onBeforeLoadScene) {
            onBeforeLoadScene();
        }

        // init scene
        //scene.onReady();
        Engine._renderContext.onSceneLoaded(scene);
// @ifdef EDITOR
        //if (editorCallback.onSceneLoaded) {
        //    editorCallback.onSceneLoaded(scene);
        //}
// @endif

        // launch scene
        Engine._scene = scene;
        Engine._renderContext.onSceneLaunched(scene);
// @ifdef EDITOR
        if (editorCallback.onSceneLaunched) {
            editorCallback.onSceneLaunched(scene);
        }
// @endif

        scene.activate();
    };

    /**
     * Loads the scene by its name.
     * @method Fire.Engine.loadScene
     * @param {string} sceneName - the name of the scene to load
     * @param {function} [onLaunched]
     * @param {function} [onUnloaded] - will be called when the previous scene was unloaded
     */
    Engine.loadScene = function (sceneName, onLaunched, onUnloaded) {
        var uuid = Engine._sceneInfos[sceneName];
        if (uuid) {
            Engine._loadSceneByUuid(uuid, onLaunched, onUnloaded);
        }
        else {
            Fire.error('[Engine.loadScene] The scene "%s" could not be loaded because it has not been added to the build settings.');
        }
    };

    /**
     * Load scene
     * @method Fire.Engine.loadScene
     * @param {string} uuid - the uuid of the scene asset to load
     * @param {function} [onLaunched]
     * @param {function} [onUnloaded] - will be called when the previous scene was unloaded
     */
    Engine._loadSceneByUuid = function (uuid, onLaunched, onUnloaded) {
        // TODO: lookup uuid by name
        isLoadingScene = true;
        AssetLibrary.unloadAsset(uuid);     // force reload
        AssetLibrary._loadAssetByUuid(uuid, function onSceneLoaded (error, scene) {
            if (error) {
                Fire.error('Failed to load scene: ' + error);
                // @ifdef EDITOR
                console.throw('[test] Failed to load scene');
                // @endif
                isLoadingScene = false;
                if (onLaunched) {
                    onLaunched(null, error);
                }
                return;
            }
            if (!(scene instanceof Fire._Scene)) {
                error = 'The asset ' + uuid + ' is not a scene';
                Fire.error(error);
                isLoadingScene = false;
                if (onLaunched) {
                    onLaunched(null, error);
                }
                return;
            }

            Engine._setCurrentScene(scene, onUnloaded);

            isLoadingScene = false;
            if (onLaunched) {
                onLaunched(scene);
            }
        });
    };

    return Engine;
})();

Fire.Engine = Engine;
