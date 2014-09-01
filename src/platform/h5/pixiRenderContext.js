/**
 * The web renderer implemented rely on pixi.js
 */
var RenderContext = (function () {

    /**
     * @param width {number}
     * @param height {number}
     * @param [canvas] {Canvas}
     */
    function RenderContext (width, height, canvas) {
        width = width || 800;
        height = height || 600;
        var transparent = false;
        var antialias = false;

        this.stage = new PIXI.Stage(0x000000);
        this.renderer = PIXI.autoDetectRenderer(width, height, canvas, transparent, antialias);
    }
    
    // Setup PIXI

    PIXI.dontSayHello = true;
    PIXI.DisplayObject.prototype.updateTransform = function () {};

    var emptyTexture = new PIXI.Texture(new PIXI.BaseTexture());


    // properties
    Object.defineProperty(RenderContext.prototype, 'element', {
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
        }
    });

    // functions


    RenderContext.prototype.render = function () {
        this.renderer.render(this.stage);
    };

    /**
     * @param target {FIRE.SpriteRenderer}
     */
    RenderContext.prototype.addSprite = function (target) {
        var sprite = target.sprite;
        var tex = createTexture(sprite) || emptyTexture;
        target._renderObj = new PIXI.Sprite(tex);
        this.stage.addChild(target._renderObj);
    };

    /**
     * @param target {FIRE.SpriteRenderer}
     * @param show {boolean}
     */
    RenderContext.prototype.show = function (target, show) {
        target._renderObj.visible = show;
    };

    /**
     * @param target {FIRE.SpriteRenderer}
     * @param show {boolean}
     */
    RenderContext.prototype.remove = function (target) {
        var obj = target._renderObj;
        if (obj) {
            this.stage.removeChild(obj);
            target._renderObj = null;
        }
        else {
            console.error('' + target + ' not in render context');
        }
    };

    /**
     * @param target {FIRE.SpriteRenderer}
     */
    RenderContext.prototype.updateMaterial = function (target) {
        var obj = target._renderObj;
        if (obj) {
            var tex = createTexture(target.sprite);
            obj.setTexture(tex || emptyTexture);
        }
        else {
            console.error('' + target + ' must be added to render context first!');
        }
    };

    /**
     * @param target {FIRE.SpriteRenderer}
     */
    RenderContext.prototype.updateTransform = function (target) {
        var obj = target._renderObj;
        if (obj) {
            obj.worldTransform = target.transform._worldTransform;
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
            return new PIXI.Texture(img, new PIXI.Rectangle(sprite.x, sprite.y, sprite.width, sprite.height));
        }
        else {
            return null;
        }
    }

    return RenderContext;
})();

__TESTONLY__.RenderContext = RenderContext;
