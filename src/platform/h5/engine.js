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

    // is logic paused
    Object.defineProperty(Engine, 'isLoadingScene', {
        get: function () {
            return isLoadingScene;
        },
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
     * @returns {Canvas}
     */
    Engine.init = function ( w, h, canvas, scene ) {
        if (inited) {
            console.error('Engine already inited');
            return;
        }
        inited = true;

        Engine._scene = scene || new Scene();
        Engine._renderContext = new RenderContext( w, h, canvas );
        return Engine._renderContext.element;
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

    var doUpdate = function (updateLogic) {
        //console.log('canUpdateLogic: ' + updateLogic + ' Time: ' + Time);
        // TODO: scheduler
        if (updateLogic) {
            Engine._scene.update();
            FObject._deferredDestroy();
        }
        // render
        Engine._scene.render(Engine._renderContext);
        //if (Engine._renderContext.scene) {
        //    Engine._scene.render(Engine._renderContext.scene);
        //}
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
     * @method FIRE.Engine._loadScene
     * @param {Scene} scene
     * @private
     */
    Engine._loadScene = function (scene) {
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

        // load scene
        Engine._scene = scene;
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
            Engine._loadScene(scene);

            isLoadingScene = false;
            callback(scene, error);
        });
    };

    return Engine;
})();

FIRE.Engine = Engine;
