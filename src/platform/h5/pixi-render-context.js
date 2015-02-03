
// Tweak PIXI
PIXI.dontSayHello = true;
var EMPTY_METHOD = function () {};
PIXI.DisplayObject.prototype.updateTransform = EMPTY_METHOD;
PIXI.DisplayObject.prototype.displayObjectUpdateTransform = EMPTY_METHOD;
PIXI.DisplayObjectContainer.prototype.displayObjectContainerUpdateTransform = EMPTY_METHOD;

/**
 * The web renderer implemented rely on pixi.js
 */
var RenderContext = (function () {

    /**
     * render context 将在 pixi 中维护同样的 scene graph，这样做主要是为之后的 clipping 和 culling 提供支持。
     * 这里采用空间换时间的策略，所有 entity 都有对应的 PIXI.DisplayObjectContainer。
     * 毕竟一般 dummy entity 不会很多，因此这样产生的冗余对象可以忽略。
     * 值得注意的是，sprite 等 pixi object，被视为 entity 对应的 PIXI.DisplayObjectContainer 的子物体，
     * 并且排列在所有 entity 之前，以达到最先渲染的效果。
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

        //// table stores pixi objects in this stage, they looked up by the id of corresponding scene objects.
        //this._pixiObjects = {};

    }

    var emptyTexture = new PIXI.Texture(new PIXI.BaseTexture());

    // static

    RenderContext.initRenderer = function (renderer) {
        renderer._renderObj = null;
        renderer._renderObjInScene = null;
        renderer._tempMatrix = new Fire.Matrix23();
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

    Object.defineProperty(RenderContext.prototype, 'background', {
        set: function (value) {
            this.stage.setBackgroundColor(value.toRGBValue());
        }
    });

    Object.defineProperty(RenderContext.prototype, 'camera', {
        get: function () {
            //return (this._camera && this._camera.isValid) || null;
            return this._camera;
        },
        set: function (value) {
            this._camera = value;
            if (Fire.isValid(value)) {
                value.renderContext = this;
            }
        }
    });

    // functions

    RenderContext.prototype.render = function () {
        this.renderer.render(this.stage);
    };

    /**
     * @param {Fire.Entity} entity
     */
    RenderContext.prototype.onRootEntityCreated = function (entity) {
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
     * @param {Fire.Entity} entityParent
     * @param {boolean} inSceneView
     * @param {Fire.Entity} [customFirstChildEntity=null]
     * @returns {number}
     */
    RenderContext._getChildrenOffset = function (entityParent, inSceneView, customFirstChildEntity) {
        if (entityParent) {
            var pixiParent = inSceneView ? entityParent._pixiObjInScene : entityParent._pixiObj;
            var firstChildEntity = customFirstChildEntity || entityParent._children[0];
            if (firstChildEntity) {
                var firstChildPixi = inSceneView ? firstChildEntity._pixiObjInScene : firstChildEntity._pixiObj;
                var offset = pixiParent.children.indexOf(firstChildPixi);
                if (offset !== -1) {
                    return offset;
                }
                else if (customFirstChildEntity) {
                    return pixiParent.children.length;
                }
                else {
                    Fire.error("%s's pixi object not contains in its pixi parent's children", firstChildEntity.name);
                    return -1;
                }
            }
            else {
                return pixiParent.children.length;
            }
        }
        else {
            return 0;   // the root of hierarchy
        }
    };

    /**
     * @param {Fire.Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    RenderContext.prototype.onEntityIndexChanged = function (entity, oldIndex, newIndex) {
        var array = null;
        var siblingOffset = 0;  // skip renderers of entity
        var lastFirstSibling = null;
        if (newIndex === 0 && oldIndex > 0) {
            // insert to first
            lastFirstSibling = entity.getSibling(1);
        }
        else if (oldIndex === 0 && newIndex > 0) {
            // move first to elsewhere
            lastFirstSibling = entity;
        }
        var newPixiIndex = 0;
        // game view
        var item = entity._pixiObj;
        if (item) {
            siblingOffset = RenderContext._getChildrenOffset(entity._parent, false, lastFirstSibling);
            array = item.parent.children;
            array.splice(oldIndex + siblingOffset, 1);
            newPixiIndex = newIndex + siblingOffset;
            if (newPixiIndex < array.length) {
                array.splice(newPixiIndex, 0, item);
            }
            else {
                array.push(item);
            }
        }
        // scene view
        if (this.sceneView) {
            siblingOffset = RenderContext._getChildrenOffset(entity._parent, true, lastFirstSibling);
            item = entity._pixiObjInScene;
            array = item.parent.children;
            array.splice(oldIndex + siblingOffset, 1);
            newPixiIndex = newIndex + siblingOffset;
            if (newPixiIndex < array.length) {
                array.splice(newPixiIndex, 0, item);
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
            this.onEntityCreated(entities[i], false);
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

    RenderContext.prototype.onEntityCreated = function (entity, addToScene) {
        entity._pixiObj = new PIXI.DisplayObjectContainer();
        if (entity._parent) {
            entity._parent._pixiObj.addChild(entity._pixiObj);
        }
        else if (addToScene) {
            this.root.addChild(entity._pixiObj);
        }
        if (this.sceneView) {
            entity._pixiObjInScene = new PIXI.DisplayObjectContainer();
            if (entity._parent) {
                entity._parent._pixiObjInScene.addChild(entity._pixiObjInScene);
            }
            else if (addToScene) {
                this.sceneView.root.addChild(entity._pixiObjInScene);
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
        var tex = createTexture(target._sprite) || emptyTexture;

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
            var tex = createTexture(target._sprite) || emptyTexture;
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
     * @param {Fire.SpriteRenderer} target
     * @param {Fire.Matrix23} matrix - the final matrix to render (Read Only)
     */
    RenderContext.prototype.updateTransform = function (target, matrix) {
        // caculate matrix for pixi
        var mat = target._tempMatrix;
        mat.a = matrix.a;
        // negate the rotation because our rotation transform not the same with pixi
        mat.b = - matrix.b;
        mat.c = - matrix.c;
        //
        mat.d = matrix.d;
        mat.tx = matrix.tx;
        // revert Y axis for pixi
        mat.ty = this.renderer.height - matrix.ty;

        // apply matrix
        var isGameView = this === Engine._renderContext;
        if (isGameView) {
            if (target._renderObj) {
                target._renderObj.worldTransform = mat;
                return;
            }
        }
        else if (target._renderObjInScene) {
            target._renderObjInScene.worldTransform = mat;
            return;
        }
        Fire.error('' + target + ' must be added to render context first!');
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
    //    var pixiNode = this._pixiObjects[transform.id];
    //    var array = pixiNode.parent.children;
    //    var oldIndex = array.indexOf(pixiNode);
    //    var newIndex = transform.getSiblingIndex(); // TODO: 如果前面的节点包含空的entity，则这个new index会有问题
    //    // skip entities not exists in pixi
    //    while ((--newIndex) > 0) {
    //        var previous = transform.getSibling(newIndex);
    //        if (previous.id) {
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

// @ifdef DEV
/**
 * The debugging method that checks whether the render context matches the current scene or not.
 * @throws {string} error info
 */
RenderContext.prototype.checkMatchCurrentScene = function () {
    var entities = Engine._scene.entities;
    var pixiGameNodes = this.stage.children;
    var pixiSceneNodes;
    if (this.sceneView) {
        pixiSceneNodes = this.sceneView.stage.children;
        pixiSceneNodes = pixiSceneNodes[1].children;    // skip forground and background
    }

    function checkMatch (ent, gameNode, sceneNode) {
        if (sceneNode && ent._pixiObjInScene !== sceneNode) {
            throw new Error('entity does not match pixi scene node: ' + ent.name);
        }
        //if (!(ent._objFlags & HideInGame)) {
        //    var gameNode = gameNodes[g++];
        //}
        if (ent._pixiObj !== gameNode) {
            throw new Error('entity does not match pixi game node: ' + ent.name);
        }

        var childCount = ent._children.length;
        var sceneChildrenOffset;
        if (sceneNode) {
            sceneChildrenOffset = RenderContext._getChildrenOffset(ent, true);
            if (sceneNode.children.length !== childCount + sceneChildrenOffset) {
                console.error('Mismatched list of child elements in Scene view, entity: %s,\n' +
                    'pixi childCount: %s, entity childCount: %s, rcOffset: %s',
                    ent.name, sceneNode.children.length, childCount, sceneChildrenOffset);
                throw new Error('(see above error)');
            }
        }
        var gameChildrenOffset = RenderContext._getChildrenOffset(ent, false);
        if (gameNode.children.length !== childCount + gameChildrenOffset) {
            throw new Error('Mismatched list of child elements in Game view, entity: ' + ent.name);
        }
        for (var i = 0; i < childCount; i++) {
            checkMatch(ent._children[i], gameNode.children[gameChildrenOffset + i], sceneNode && sceneNode.children[i + sceneChildrenOffset]);
        }
    }

    for (var i = 0; i < entities.length; i++) {
        if (pixiSceneNodes && pixiSceneNodes.length !== entities.length) {
            throw new Error('Mismatched list of root elements in scene view');
        }
        if (pixiGameNodes.length !== entities.length) {
            throw new Error('Mismatched list of root elements in game view');
        }
        checkMatch(entities[i], pixiGameNodes[i], pixiSceneNodes && pixiSceneNodes[i]);
    }

    //if (g !== pixiGameNodes.length) {
    //    Fire.error('pixi has extra game node, pixi count: ' + pixiGameNodes.length + ' expected count: ' + g);
    //    return false;
    //}
    // 目前不测试renderer
};
// @endif

Fire._RenderContext = RenderContext;
