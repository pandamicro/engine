    
// Setup PIXI

PIXI.dontSayHello = true;
PIXI.DisplayObject.prototype.updateTransform = function () {};

/**
 * The web renderer implemented rely on pixi.js
 */
var RenderContext = (function () {

    /**
     * render context 将在 pixi 中维护同样的 scene graph，这样做主要是为之后的 clipping 和 culling 提供支持。
     * 这里采用空间换时间的策略，所有 entity 都有对应的 PIXI.DisplayObjectContainer。
     * 毕竟一般 dummy entity 不会很多，因此这样产生的冗余对象可以忽略。
     * 
     * @param {number} width
     * @param {number} height
     * @param {Canvas} [canvas]
     * @param {boolean} [transparent = false]
     */
    function RenderContext (width, height, canvas, transparent) {
        width = width || 800;
        height = height || 600;
        transparent = transparent || false;
        //showGizmos = typeof showGizmos !== 'undefined' ? showGizmos : false;

        var antialias = false;
        this.stage = new PIXI.Stage(0x000000);
        this.root = this.stage;
        this.renderer = PIXI.autoDetectRenderer(width, height, {
            view: canvas, 
            transparent: transparent, 
            antialias: antialias
        } );

        //this.showGizmos = showGizmos;

        // the shared render context that allows display the object which marked as Fire._ObjectFlags.HideInGame
        this.sceneView = null;

        // binded camera, if supplied the scene will always rendered by this camera
        this._camera = null;

        //// table stores pixi objects in this stage, they looked up by the hashKey of corresponding scene objects.
        //this._pixiObjects = {};

    }

    var emptyTexture = new PIXI.Texture(new PIXI.BaseTexture());

    // static

    RenderContext.initRenderer = function (renderer) {
        renderer._renderObj = null;
        renderer._renderObjInScene = null;
    };

    // properties

    Object.defineProperty(RenderContext.prototype, 'canvas', {
        get: function () {
            return this.renderer.view;
        }
    });

    Object.defineProperty(RenderContext.prototype, 'size', {
        get: function () {
            return new Vec2(this.renderer.width, this.renderer.height);
        },
        set: function (value) {
            this.renderer.resize(value.x, value.y);
            // DISABLE
            // // auto resize scene view camera
            // if (this._camera && (this._camera.entity._objFlags & Fire._ObjectFlags.EditorOnly)) {
            //     this._camera.size = value.y;
            // }
        }
    });

    Object.defineProperty(RenderContext.prototype, 'camera', {
        get: function () {
            return this._camera;
        },
        set: function (value) {
            this._camera = value;
            value.renderContext = this;
        }
    });

    // functions

    RenderContext.prototype.render = function () {
        this.renderer.render(this.stage);
    };

    /**
     * @param {Fire.Entity} entity
     */
    RenderContext.prototype.onEntityCreated = function (entity) {
        // always create pixi node even if is scene gizmo, to keep all their indice sync with transforms' sibling indice.
        entity._pixiObj = new PIXI.DisplayObjectContainer();
        if (Engine._canModifyCurrentScene) {
            // attach node if created dynamically
            this.root.addChild(entity._pixiObj);
        }
        if (this.sceneView) {
            entity._pixiObjInScene = new PIXI.DisplayObjectContainer();
            if (Engine._canModifyCurrentScene) {
                // attach node if created dynamically
                this.sceneView.root.addChild(entity._pixiObjInScene);
            }
        }
    };

    /**
     * removes a entity and all its children from scene
     * @param {Fire.Entity} entity
     */
    RenderContext.prototype.onEntityRemoved = function (entity) {
        if (entity._pixiObj) {
            if (entity._pixiObj.parent) {
                entity._pixiObj.parent.removeChild(entity._pixiObj);
            }
            entity._pixiObj = null;
        }
        if (entity._pixiObjInScene) {
            if (entity._pixiObjInScene.parent) {
                entity._pixiObjInScene.parent.removeChild(entity._pixiObjInScene);
            }
            entity._pixiObjInScene = null;
        }
    };

    /**
     * @param {Fire.Entity} entity
     * @param {Fire.Entity} oldParent
     */
    RenderContext.prototype.onEntityParentChanged = function (entity, oldParent) {
        if (entity._pixiObj) {
            if (entity._parent) {
                entity._parent._pixiObj.addChild(entity._pixiObj);
            }
            else {
                this.root.addChild(entity._pixiObj);
            }
        }
        if (this.sceneView) {
            if (entity._parent) {
                entity._parent._pixiObjInScene.addChild(entity._pixiObjInScene);
            }
            else {
                this.sceneView.root.addChild(entity._pixiObjInScene);
            }
        }
    };

    /**
     * @param {Fire.Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    RenderContext.prototype.onEntityIndexChanged = function (entity, oldIndex, newIndex) {
        var item = entity._pixiObj;
        var array = null;
        if (item) {
            array = item.parent.children;
            array.splice(oldIndex, 1);
            if (newIndex < array.length) {
                array.splice(newIndex, 0, item);
            }
            else {
                array.push(item);
            }
        }

        if (this.sceneView) {
            item = entity._pixiObjInScene;
            array = item.parent.children;
            array.splice(oldIndex, 1);
            if (newIndex < array.length) {
                array.splice(newIndex, 0, item);
            }
            else {
                array.push(item);
            }
        }
    };

    RenderContext.prototype.onSceneLaunched = function (scene) {
        // attach root nodes
        var entities = scene.entities;
        var i = 0, len = entities.length;
        for (; i < len; i++) {
            var objInGame = entities[i]._pixiObj;
            if (objInGame) {
                this.root.addChild(objInGame);
            }
        }
        if (this.sceneView) {
            for (i = 0; i < len; i++) {
                this.sceneView.root.addChild(entities[i]._pixiObjInScene);
            }
        }
    };

    RenderContext.prototype.onSceneLoaded = function (scene) {
        var entities = scene.entities;
        for (var i = 0, len = entities.length; i < len; i++) {
            this.onEntityLoaded(entities[i]);
        }
    };

    /**
     * create child nodes recursively
     * 这个方法假定parent存在
     * @param {Fire.Entity} entity - must have parent, and not scene gizmo
     */
    var _onChildEntityLoaded = function (entity, hasSceneView) {
        entity._pixiObj = new PIXI.DisplayObjectContainer();
        entity._parent._pixiObj.addChild(entity._pixiObj);
        if (hasSceneView) {
            entity._pixiObjInScene = new PIXI.DisplayObjectContainer();
            entity._parent._pixiObjInScene.addChild(entity._pixiObjInScene);
        }
        var children = entity._children;
        for (var i = 0, len = children.length; i < len; i++) {
            _onChildEntityLoaded(children[i], hasSceneView);
        }
    };

    /**
     * create nodes recursively
     * 这个方法会判断是否有parent，将来也会用在prefab
     * @param {Fire.Entity} entity - must not scene gizmo
     */
    RenderContext.prototype.onEntityLoaded = function (entity) {
        entity._pixiObj = new PIXI.DisplayObjectContainer();
        if (entity._parent) {
            entity._parent._pixiObj.addChild(entity._pixiObj);
        }
        if (this.sceneView) {
            entity._pixiObjInScene = new PIXI.DisplayObjectContainer();
            if (entity._parent) {
                entity._parent._pixiObjInScene.addChild(entity._pixiObjInScene);
            }
        }

        var children = entity._children;
        for (var i = 0, len = children.length; i < len; i++) {
            _onChildEntityLoaded(children[i], this.sceneView);
        }
    };

    /**
     * @param {Fire.SpriteRenderer} target
     */
    RenderContext.prototype.addSprite = function (target) {
        var tex = createTexture(target.sprite) || emptyTexture;

        var inGame = !(target.entity._objFlags & HideInGame);
        if (inGame) {
            target._renderObj = new PIXI.Sprite(tex);
            target.entity._pixiObj.addChildAt(target._renderObj, 0);
        }

        if (this.sceneView) {
            // pixi may not share display object between stages at the same time, 
            // so another sprite is needed.
            target._renderObjInScene = new PIXI.Sprite(tex);
            target.entity._pixiObjInScene.addChildAt(target._renderObjInScene, 0);
        }
    };

    /**
     * @param {Fire.SpriteRenderer} target
     * @param {boolean} show
     */
    RenderContext.prototype.show = function (target, show) {
        if (target._renderObj) {
            target._renderObj.visible = show;
        }
        if (target._renderObjInScene) {
            target._renderObjInScene.visible = show;
        }
    };

    /**
     * @param target {Fire.SpriteRenderer}
     * @param show {boolean}
     */
    RenderContext.prototype.remove = function (target) {
        if (target._renderObj) {
            target._renderObj.parent.removeChild(target._renderObj);
            target._renderObj = null;
        }
        if (target._renderObjInScene) {
            target._renderObjInScene.parent.removeChild(target._renderObjInScene);
            target._renderObjInScene = null;
        }
    };

    /**
     * @param target {Fire.SpriteRenderer}
     */
    RenderContext.prototype.updateMaterial = function (target) {
        if (target._renderObj || target._renderObjInScene) {
            var tex = createTexture(target.sprite) || emptyTexture;
            if (target._renderObj) {
                target._renderObj.setTexture(tex);
            }
            if (target._renderObjInScene) {
                target._renderObjInScene.setTexture(tex);
            }
        }
        else {
            Fire.error('' + target + ' must be added to render context first!');
        }
    };

    /**
     * @param target {Fire.SpriteRenderer}
     */
    RenderContext.prototype.updateTransform = function (target) {
        if (target._renderObj || target._renderObjInScene) {
            var isGameView = this === Engine._renderContext;
            var mat = target.transform._worldTransform.clone();
            // revert Y axis for pixi
            mat.ty = this.renderer.height - mat.ty;
            // negate the rotation because our rotation transform not the same with pixi
            mat.c = -mat.c;    
            mat.b = -mat.b;
            //
            if (isGameView) {
                if (target._renderObj) {
                    target._renderObj.worldTransform = mat;
                }
            }
            else if (target._renderObjInScene) {
                target._renderObjInScene.worldTransform = mat;
            }
        }
        else {
            Fire.error('' + target + ' must be added to render context first!');
        }
    };

    ///**
    // * @param {Fire.SpriteRenderer} target
    // * @param {Fire.SpriteRenderer} transform
    // * @param {Fire.SpriteRenderer} oldParent
    // */
    //RenderContext.prototype.updateHierarchy = function (target, transform, oldParent) {
    //    if (target._renderObj || target._renderObjInScene) {
    //        if (transform._parent === oldParent) {
    //            // oldAncestor changed its sibling index
    //            if (target._renderObj) {
    //                this._updateSiblingIndex(transform);
    //            }
    //            if (target._renderObjInScene) {
    //                this.sceneView._updateSiblingIndex(transform);
    //            }
    //            return true;
    //        }
    //        else {
    //            // parent changed
    //        }
    //    }
    //    else {
    //        Fire.error('' + target + ' must be added to render context first!');
    //    }
    //    return false;
    //};

    //RenderContext.prototype._updateSiblingIndex = function (transform) {
    //    var pixiNode = this._pixiObjects[transform.hashKey];
    //    var array = pixiNode.parent.children;
    //    var oldIndex = array.indexOf(pixiNode);
    //    var newIndex = transform.getSiblingIndex(); // TODO: 如果前面的节点包含空的entity，则这个new index会有问题
    //    // skip entities not exists in pixi
    //    while ((--newIndex) > 0) {
    //        var previous = transform.getSibling(newIndex);
    //        if (previous.hashKey) {
    //        }
    //    }
    //    array.splice(oldIndex, 1);
    //    if (newIndex < array.length) {
    //        array.splice(newIndex, 0, pixiNode);
    //    }
    //    else {
    //        array.push(pixiNode);
    //    }
    //};

    /**
     * @param sprite {Fire.Sprite}
     */
    function createTexture(sprite) {
        if (sprite && sprite.texture && sprite.texture.image) {
            var img = new PIXI.BaseTexture(sprite.texture.image);
            var frame = new PIXI.Rectangle(sprite.x, sprite.y, Math.min(img.width - sprite.x, sprite.width), Math.min(img.height - sprite.y, sprite.height));
            return new PIXI.Texture(img, frame);
        }
        else {
            return null;
        }
    }

    return RenderContext;
})();

Fire._RenderContext = RenderContext;
