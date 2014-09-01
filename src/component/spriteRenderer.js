var SpriteRenderer = (function () {
    var _super = Component;

    // constructor
    function SpriteRenderer () {
        _super.call(this);
        this._sprite = null;
        this._renderObj = null;
    }
    FIRE.extend("FIRE.SpriteRenderer", SpriteRenderer, _super);

    // properties
    Object.defineProperty(SpriteRenderer.prototype, 'sprite', {
        get: function () {
            return this._sprite;
        },
        set: function (value) {
            this._sprite = value;
            Engine._renderContext.updateMaterial(this);
        }
    });

    // built-in functions
    SpriteRenderer.prototype.onLoad = function () {
        Engine._renderContext.addSprite(this);
    };
    SpriteRenderer.prototype.onEnable = function () {
        Engine._renderContext.show(this, true);
    };
    SpriteRenderer.prototype.onDisable = function () {
        Engine._renderContext.show(this, false);
    };
    SpriteRenderer.prototype.onPreRender = function () {
        Engine._renderContext.updateTransform(this);
    };
    SpriteRenderer.prototype.onDestroy = function () {
        Engine._renderContext.remove(this);
    };

    // other functions

    return SpriteRenderer;
})();

FIRE.SpriteRenderer = SpriteRenderer;
