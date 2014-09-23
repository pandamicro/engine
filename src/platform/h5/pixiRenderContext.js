    
// Setup PIXI

PIXI.dontSayHello = true;
PIXI.DisplayObject.prototype.updateTransform = function () {};

/**
 * The web renderer implemented rely on pixi.js
 */
var RenderContext = (function () {

    /**
     * @param {number} width
     * @param {number} height
     * @param {Canvas} [canvas]
     */
    function RenderContext (width, height, canvas/*, showGizmos*/) {
        width = width || 800;
        height = height || 600;
        //showGizmos = typeof showGizmos !== 'undefined' ? showGizmos : false;

        var transparent = false;
        var antialias = false;
        this.stage = new PIXI.Stage(0x000000);
        this.renderer = PIXI.autoDetectRenderer(width, height, canvas, transparent, antialias);

        //this.showGizmos = showGizmos;

        // the shared render context that allows display the object which marked as FIRE.ObjectFlags.SceneGizmo
        this.scene = null;

        // binded camera, if supplied the scene will always rendered by this camera
        this._camera = null;
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
            // auto resize scene view camera
            if (this._camera && (this._camera.entity._objFlags & FIRE.ObjectFlags.EditorOnly)) {
                this._camera.size = value.y;
            }
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
     * @param {FIRE.SpriteRenderer} target
     */
    RenderContext.prototype.addSprite = function (target) {
        var tex = createTexture(target.sprite) || emptyTexture;

        var isGizmo = (target.entity._objFlags & SceneGizmo);
        if (!isGizmo) {
            target._renderObj = new PIXI.Sprite(tex);
            this.stage.addChild(target._renderObj);
        }

        if (this.scene) {
            target._renderObjInScene = new PIXI.Sprite(tex);    // pixi can not share display object between stages at the same time
            this.scene.stage.addChild(target._renderObjInScene);
        }
    };

    /**
     * @param {FIRE.SpriteRenderer} target
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
     * @param target {FIRE.SpriteRenderer}
     * @param show {boolean}
     */
    RenderContext.prototype.remove = function (target) {
        if (target._renderObj) {
            this.stage.removeChild(target._renderObj);
            target._renderObj = null;
        }
        if (target._renderObjInScene) {
            this.scene.stage.removeChild(target._renderObjInScene);
            target._renderObjInScene = null;
        }
    };

    /**
     * @param target {FIRE.SpriteRenderer}
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
            console.error('' + target + ' must be added to render context first!');
        }
    };

    /**
     * @param target {FIRE.SpriteRenderer}
     */
    RenderContext.prototype.updateTransform = function (target) {
        if (target._renderObj || target._renderObjInScene) {
            if (target._renderObj) {
                target._renderObj.worldTransform = target.transform._worldTransform;
            }
            if (target._renderObjInScene) {
                target._renderObjInScene.worldTransform = target.transform._worldTransform;
            }
        }
        else {
            console.error('' + target + ' must be added to render context first!');
        }
    };

    /**
     * @param {FIRE.SpriteRenderer} target
     * @param {FIRE.SpriteRenderer} transform
     * @param {FIRE.SpriteRenderer} oldParent
     */
    RenderContext.prototype.updateHierarchy = function (target, transform, oldParent) {
        if (target._renderObj || target._renderObjInScene) {
            if (target._renderObj) {
                
            }
            if (target._renderObjInScene) {
                
            }
        }
        else {
            console.error('' + target + ' must be added to render context first!');
        }
    };


    /**
     * @param sprite {FIRE.Sprite}
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
