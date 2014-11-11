
var Engine = (function () {

    var Engine = {
        _editorCallback: editorCallback,
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

    // is rendering and allow update logic
    Object.defineProperty(Engine, 'isPlaying', {
        get: function () {
            return isPlaying;
        },
    });

    // is logic paused
    Object.defineProperty(Engine, 'isPaused', {
        get: function () {
            return isPaused;
        },
    });

    // is loading scene and its assets asynchronous
    Object.defineProperty(Engine, 'isLoadingScene', {
        get: function () {
            return isLoadingScene;
        },
    });

    var lockingScene = null;

    /**
     * You should check whether you can modify the scene in constructors which may called by the engine while deserializing.
     * @param {boolean} Engine._canModifyCurrentScene
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
                    Fire.error('another scene still locked: ' + lockingScene.debugName);
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
            render();
        }
    });

    var inited = false;
    Object.defineProperty(Engine, 'inited', {
        get: function () {
            return inited;
        },
    });

    // functions

    /**
     * @param {number} [w]
     * @param {number} [h]
     * @param {Canvas} [canvas]
     * @param {Fire._Scene} [scene]
     * @returns {RenderContext}
     */
    Engine.init = function ( w, h, canvas, scene ) {
        if (inited) {
            Fire.error('Engine already inited');
            return;
        }
        inited = true;

        Engine._renderContext = new RenderContext( w, h, canvas );
        Engine._interactionContext = new InteractionContext();

        // Engine._setCurrentScene(scene || new Scene());

        return Engine._renderContext;
    };
    
    Engine.play = function () {
        if (isPlaying && !isPaused) {
            Fire.warn('Fireball is already playing');
            return;
        }
        if (isPlaying && isPaused) {
            isPaused = false;
            return;
        }
        isPlaying = true;

        var now = Ticker.now();
        Time._restart(now);
        update();
    };

    Engine.stop = function () {
        // reset states
        isPlaying = false;
        isPaused = false;
        isLoadingScene = false; // TODO: what if loading scene ?
        if (requestId !== -1) {
            Ticker.cancelAnimationFrame(requestId);
            requestId = -1;
        }
    };
    
    Engine.pause = function () {
        isPaused = true;
    };

    Engine.step = function () {
        isPaused = true;
        stepOnce = true;
        if (isPlaying === false) {
            Engine.play();
        }
    };

    var render = function () {
        // render
        Engine._scene.render(Engine._renderContext);

        // update interaction context
        Engine._scene.updateInteractionContext(Engine._interactionContext);

        // test scene view
        if (Fire.isPureWeb && Engine._renderContext.sceneView) {
            Engine._scene.render(Engine._renderContext.sceneView);
        }
    };

    var doUpdate = function (updateLogic) {
        //Fire.log('canUpdateLogic: ' + updateLogic + ' Time: ' + Time);
        // TODO: scheduler
        if (updateLogic) {
            Engine._scene.update();
            FObject._deferredDestroy();
        }
        render();
    };

    /**
     * @method Fire.Engine.update
     * @param {float} [unused] - not used parameter, can omit
     * @private
     */
    var update = function (unused) {
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

        // for test
        if (__TESTONLY__.update) {
            __TESTONLY__.update(updateLogic);
        }
    };
    Engine.update = update;

    /**
     * Set current scene directly, only used in Editor
     * @method Fire.Engine._setCurrentScene
     * @param {Scene} scene
     * @private
     */
    Engine._setCurrentScene = function (scene) {
        if (!scene) {
            Fire.error('Argument must be non-nil');
            return;
        }
        // unload scene
        var oldScene = Engine._scene;
        if (FObject.isValid(oldScene)) {
            oldScene.destroy();
            FObject._deferredDestroy(); // simulate destroy immediate
        }

        // launch scene
        Engine._scene = scene;
        scene.onLaunch();
        
        Engine._renderContext.onSceneLaunched(scene);
        if (editorCallback.onSceneLaunched) {
            editorCallback.onSceneLaunched(scene);
        }
    };

    /**
     * Load scene sync
     * @method Fire.Engine.loadScene
     * @param {string} name - the scene name
     */
    Engine.loadScene = function (uuid, callback) {
        // TODO: lookup uuid by name
        isLoadingScene = true;
        AssetLibrary.loadAssetByUuid(uuid, function onSceneLoaded (scene, error) {
            if (error) {
                Fire.error('Failed to load scene: ' + error);
                isLoadingScene = false;
                callback(null, error);
                return;
            }
            if (!(scene instanceof Fire._Scene)) {
                error = 'The asset ' + uuid + ' is not a scene';
                Fire.error(error);
                isLoadingScene = false;
                callback(null, error);
                return;
            }
            //scene.onReady();
            Engine._renderContext.onSceneLoaded(scene);
            if (editorCallback.onSceneLoaded) {
                editorCallback.onSceneLoaded(scene);
            }

            Engine._setCurrentScene(scene);

            isLoadingScene = false;
            callback(scene);
        });
    };

    return Engine;
})();

Fire.Engine = Engine;
