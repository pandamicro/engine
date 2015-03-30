
(function () {
    // Tweak PIXI
    PIXI.dontSayHello = true;
    var EMPTY_METHOD = function () {};
    PIXI.DisplayObject.prototype.updateTransform = EMPTY_METHOD;
    PIXI.DisplayObject.prototype.displayObjectUpdateTransform = EMPTY_METHOD;
    PIXI.DisplayObjectContainer.prototype.displayObjectContainerUpdateTransform = EMPTY_METHOD;
})();

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

        var antialias = false;
        this.stage = new PIXI.Stage(0x000000);
        this.stage.interactive = false;

        this.root = this.stage;
        this.renderer = PIXI.autoDetectRenderer(width, height, {
            view: canvas,
            transparent: transparent,
            antialias: antialias
        } );

        // the shared render context that allows display the object which marked as Fire._ObjectFlags.HideInGame
        this.sceneView = null;

        this.isSceneView = false;

        // binded camera, if supplied the scene will always rendered by this camera
        this._camera = null;
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

    Object.defineProperty(RenderContext.prototype, 'width', {
        get: function () {
            return this.renderer.width;
        },
        set: function (value) {
            this.renderer.resize(value, this.renderer.height);
        }
    });

    Object.defineProperty(RenderContext.prototype, 'height', {
        get: function () {
            return this.renderer.height;
        },
        set: function (value) {
            this.renderer.resize(this.renderer.width, value);
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
     * @param {Entity} entity
     */
    RenderContext.prototype.onRootEntityCreated = function (entity) {
        entity._pixiObj = this._createNode();
        // @ifdef EDITOR
        if (this.sceneView) {
            entity._pixiObjInScene = this.sceneView._createNode();
        }
        // @endif
    };

    RenderContext.prototype._createNode = function () {
        // always create pixi node even if is scene gizmo, to keep all their indices sync with transforms' sibling indices.
        var node = new PIXI.DisplayObjectContainer();
        if (Engine._canModifyCurrentScene) {
            // attach node if created dynamically
            this.root.addChild(node);
        }
        return node;
    };

    /**
     * removes a entity and all its children from scene
     * @param {Entity} entity
     */
    RenderContext.prototype.onEntityRemoved = function (entity) {
        this._removeNode(entity._pixiObj);
        entity._pixiObj = null;
        // @ifdef EDITOR
        if (this.sceneView) {
            this.sceneView._removeNode(entity._pixiObjInScene);
            entity._pixiObjInScene = null;
        }
        // @endif
    };

    RenderContext.prototype._removeNode = function (node) {
        if (node && node.parent) {
            node.parent.removeChild(node);
        }
    };

    /**
     * @param {Entity} entity
     * @param {Entity} oldParent
     */
    RenderContext.prototype.onEntityParentChanged = function (entity, oldParent) {
        this._setParentNode(entity._pixiObj, entity._parent && entity._parent._pixiObj);
        // @ifdef EDITOR
        if (this.sceneView) {
            this.sceneView._setParentNode(entity._pixiObjInScene, entity._parent && entity._parent._pixiObjInScene);
        }
        // @endif
    };

    RenderContext.prototype._setParentNode = function (node, parent) {
        if (node) {
            if (parent) {
                parent.addChild(node);
            }
            else {
                this.root.addChild(node);
            }
        }
    };

    /**
     * @param {Entity} entityParent
     * @param {Entity} [customFirstChildEntity=null]
     * @return {number}
     */
    RenderContext.prototype._getChildrenOffset = function (entityParent, customFirstChildEntity) {
        if (entityParent) {
            var pixiParent = this.isSceneView ? entityParent._pixiObjInScene : entityParent._pixiObj;
            var firstChildEntity = customFirstChildEntity || entityParent._children[0];
            if (firstChildEntity) {
                var firstChildPixi = this.isSceneView ? firstChildEntity._pixiObjInScene : firstChildEntity._pixiObj;
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
     * @param {Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    RenderContext.prototype.onEntityIndexChanged = function (entity, oldIndex, newIndex) {
        var lastFirstSibling;
        if (newIndex === 0 && oldIndex > 0) {
            // insert to first
            lastFirstSibling = entity.getSibling(1);
        }
        else if (oldIndex === 0 && newIndex > 0) {
            // move first to elsewhere
            lastFirstSibling = entity;
        }

        if (entity._pixiObj) {
            this._setNodeIndex(entity, oldIndex, newIndex, lastFirstSibling);
        }
        // @ifdef EDITOR
        if (this.sceneView) {
            this.sceneView._setNodeIndex(entity, oldIndex, newIndex, lastFirstSibling);
        }
        // @endif
    };

    RenderContext.prototype._setNodeIndex = function (entity, oldIndex, newIndex, lastFirstSibling) {
        // skip renderers of entity
        var siblingOffset = this._getChildrenOffset(entity._parent, lastFirstSibling);
        //
        var node = this.isSceneView ? entity._pixiObjInScene : entity._pixiObj;
        if (node) {
            var array = node.parent.children;
            array.splice(oldIndex + siblingOffset, 1);
            var newPixiIndex = newIndex + siblingOffset;
            if (newPixiIndex < array.length) {
                array.splice(newPixiIndex, 0, node);
            }
            else {
                array.push(node);
            }
        }
    };

    RenderContext.prototype.onSceneLaunched = function (scene) {
        // attach root nodes
        this._addToScene(scene);
        // @ifdef EDITOR
        if (this.sceneView) {
            this.sceneView._addToScene(scene);
        }
        // @endif
    };

    RenderContext.prototype._addToScene = function (scene) {
        var entities = scene.entities;
        for (var i = 0, len = entities.length; i < len; i++) {
            var node = this.isSceneView? entities[i]._pixiObjInScene : entities[i]._pixiObj;
            if (node) {
                this.root.addChild(node);
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
     * @param {Entity} entity - must have parent, and not scene gizmo
     */
    var _onChildEntityCreated = function (entity, hasSceneView) {
        entity._pixiObj = new PIXI.DisplayObjectContainer();
        entity._parent._pixiObj.addChild(entity._pixiObj);
        // @ifdef EDITOR
        if (hasSceneView) {
            entity._pixiObjInScene = new PIXI.DisplayObjectContainer();
            entity._parent._pixiObjInScene.addChild(entity._pixiObjInScene);
        }
        // @endif
        var children = entity._children;
        for (var i = 0, len = children.length; i < len; i++) {
            _onChildEntityCreated(children[i], hasSceneView);
        }
    };

    /**
     * create pixi nodes recursively
     * @param {Entity} entity
     * @param {boolean} addToScene - add to pixi stage now if entity is root
     */
    RenderContext.prototype.onEntityCreated = function (entity, addToScene) {
        entity._pixiObj = new PIXI.DisplayObjectContainer();
        if (entity._parent) {
            entity._parent._pixiObj.addChild(entity._pixiObj);
        }
        else if (addToScene) {
            this.root.addChild(entity._pixiObj);
        }
        // @ifdef EDITOR
        if (this.sceneView) {
            entity._pixiObjInScene = new PIXI.DisplayObjectContainer();
            if (entity._parent) {
                entity._parent._pixiObjInScene.addChild(entity._pixiObjInScene);
            }
            else if (addToScene) {
                this.sceneView.root.addChild(entity._pixiObjInScene);
            }
        }
        // @endif

        var children = entity._children;
        for (var i = 0, len = children.length; i < len; i++) {
            _onChildEntityCreated(children[i], this.sceneView);
        }
    };

    RenderContext.prototype._addSprite = function (tex, parentNode) {
        var sprite = new PIXI.Sprite(tex);
        parentNode.addChildAt(sprite, 0);
        return sprite;
    };

    /**
     * @param {SpriteRenderer} target
     */
    RenderContext.prototype.addSprite = function (target) {
        var tex = createTexture(target._sprite);

        var inGame = !(target.entity._objFlags & HideInGame);
        if (inGame) {
            target._renderObj = this._addSprite(tex, target.entity._pixiObj);
        }
        // @ifdef EDITOR
        if (this.sceneView) {
            // pixi may not share display object between stages at the same time,
            // so another sprite is needed.
            target._renderObjInScene = this.sceneView._addSprite(tex, target.entity._pixiObjInScene);
        }
        // @endif

        this.updateSpriteColor(target);
    };

    /**
     * @param {SpriteRenderer} target
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
     * @param target {SpriteRenderer}
     * @param show {boolean}
     */
    RenderContext.prototype.remove = function (target) {
        this._removeNode(target._renderObj);
        target._renderObj = null;
        // @ifdef EDITOR
        if (this.sceneView) {
            this.sceneView._removeNode(target._renderObjInScene);
            target._renderObjInScene = null;
        }
        // @endif
    };

    RenderContext.prototype.updateSpriteColor = function (target) {
        var tint = target._color.toRGBValue();
        if (target._renderObj) {
            target._renderObj.tint = tint;
        }
        // @ifdef EDITOR
        if (target._renderObjInScene) {
            target._renderObjInScene.tint = tint;
        }
        if (!target._renderObj && !target._renderObjInScene) {
            Fire.error('' + target + ' must be added to render context first!');
        }
        // @endif
    };

    /**
     * @param target {SpriteRenderer}
     */
    RenderContext.prototype.updateMaterial = function (target) {
        var tex = createTexture(target._sprite);
        if (target._renderObj) {
            target._renderObj.setTexture(tex);
        }
        // @ifdef EDITOR
        if (target._renderObjInScene) {
            target._renderObjInScene.setTexture(tex);
        }
        if (!target._renderObj && !target._renderObjInScene) {
            Fire.error('' + target + ' must be added to render context first!');
        }
        // @endif
    };

    /**
     * Set the final transform to render
     * @param {SpriteRenderer} target
     * @param {Matrix23} matrix - the matrix to render (Read Only)
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

        var worldAlpha = Math.clamp01(target._color.a);

        // apply matrix
        if ( !this.isSceneView ) {
            if (target._renderObj) {
                target._renderObj.worldTransform = mat;
                target._renderObj.worldAlpha = worldAlpha;
            }
        }
        // @ifdef EDITOR
        else if (target._renderObjInScene) {
            target._renderObjInScene.worldTransform = mat;
            target._renderObjInScene.worldAlpha = worldAlpha;
        }
        // @endif
    };

    ///**
    // * @param {SpriteRenderer} target
    // * @param {SpriteRenderer} transform
    // * @param {SpriteRenderer} oldParent
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
     * @param sprite {Sprite}
     */
    function createTexture(sprite) {
        if (sprite && sprite.texture && sprite.texture.image) {
            var img = new PIXI.BaseTexture(sprite.texture.image);
            var frame = new PIXI.Rectangle(sprite.x, sprite.y, Math.min(img.width - sprite.x, sprite.rotatedWidth), Math.min(img.height - sprite.y, sprite.rotatedHeight));
            return new PIXI.Texture(img, frame);
        }
        else {
            return emptyTexture;
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
    var scope = this;
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
            sceneChildrenOffset = scope.sceneView._getChildrenOffset(ent);
            if (sceneNode.children.length !== childCount + sceneChildrenOffset) {
                console.error('Mismatched list of child elements in Scene view, entity: %s,\n' +
                    'pixi childCount: %s, entity childCount: %s, rcOffset: %s',
                    ent.name, sceneNode.children.length, childCount, sceneChildrenOffset);
                throw new Error('(see above error)');
            }
        }
        var gameChildrenOffset = scope._getChildrenOffset(ent);
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
