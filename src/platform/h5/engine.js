var Engine = (function () {

    var Engine = {};

    var isPlaying = false;
    var isPaused = false;
    var stepOnce = false;
    var isLoadingScene = false;

    // We should use this id to cancel ticker, otherwise if the engine stop and replay immediately,
    // last ticker will not cancel correctly.
    var requestId = -1;

    /**
     * 当前激活的场景，如果为空，一般是因为正在加载场景或Entity(例如执行FIRE.deserialize)。
     * 这样是为了防止加载中的东西不小心影响到当前场景。一般代码不用关心这个问题，但大部分构造函数里执行的代码，
     * 如果涉及到场景物件的操作，都要注意这点。
     * 也就是说构造函数调用到的代码如果要操作 Engine._scene，必须判断非空，如果操作不直接针对 Engine._scene，
     * 也判断 Engine._canModifyCurrentScene。
     * 另外，如果存在辅助场景，当在辅助场景内创建物件时，Engine._scene会被临时修改为辅助场景。
     * 
     * @property {Scene} Engine._scene - the active scene
     */
    Engine._scene = null;

    // main renderer
    Engine._renderContext = null;

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
            return !!this._scene;
        },
        set: function (value) {
            if (value) {
                // unlock
                if (lockingScene) {
                    this._scene = lockingScene;
                    lockingScene = null;
                }
                else if (!this._scene) {
                    console.error('unknown scene to unlock');
                }
            }
            else {
                // lock
                if (this._scene) {
                    if (lockingScene) {
                        console.error('another scene still locked: ' + lockingScene.debugName);
                    }
                    lockingScene = this._scene;
                    this._scene = null;
                }
                else {
                    console.error('unknown scene to lock');
                }
            }
        }
    });

    /**
     * @param {FIRE.Vec2} value
     * @return {FIRE.Vec2}
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
     * @param {FIRE._Scene} [scene]
     * @returns {RenderContext}
     */
    Engine.init = function ( w, h, canvas, scene ) {
        if (inited) {
            console.error('Engine already inited');
            return;
        }
        inited = true;

        Engine._renderContext = new RenderContext( w, h, canvas );
        Engine._setCurrentScene(scene || new Scene());
        return Engine._renderContext;
    };
    
    Engine.play = function () {
        if (isPlaying && !isPaused) {
            console.warn('Fireball is already playing');
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
        // test scene view
        if (FIRE.isPureWeb && Engine._renderContext.scene) {
            Engine._scene.render(Engine._renderContext.scene);
        }
    };

    var doUpdate = function (updateLogic) {
        //console.log('canUpdateLogic: ' + updateLogic + ' Time: ' + Time);
        // TODO: scheduler
        if (updateLogic) {
            Engine._scene.update();
            FObject._deferredDestroy();
        }
        render();
    };

    /**
     * @method FIRE.Engine.update
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
     * @method FIRE.Engine._setCurrentScene
     * @param {Scene} scene
     * @private
     */
    Engine._setCurrentScene = function (scene) {
        if (!scene) {
            console.error('Argument must be non-nil');
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
        Engine._renderContext.onLaunchScene(scene);
        scene.onLaunch();
    };

    /**
     * Load scene sync
     * @method FIRE.Engine.loadScene
     * @param {string} name - the scene name
     */
    Engine.loadScene = function (uuid, callback) {
        // TODO: lookup uuid by name
        isLoadingScene = true;
        AssetLibrary.loadAssetByUuid(uuid, function (scene, error) {
            if (error) {
                console.error('Failed to load scene: ' + error);
                isLoadingScene = false;
                callback(scene, error);
                return;
            }
            //scene.onReady();
            Engine._renderContext.onSceneLoaded(scene);

            Engine._setCurrentScene(scene);

            isLoadingScene = false;
            callback(scene, error);
        });
    };

    return Engine;
})();

FIRE.Engine = Engine;
