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
    SpriteRenderer.prototype.__defineGetter__('sprite', function () { return this._sprite; });
    SpriteRenderer.prototype.__defineSetter__('sprite', function (value) {
        this._sprite = value;
        Engine._renderContext.updateMaterial(this);
    });

    // built-in functions
    SpriteRenderer.prototype.onCreate = function () {
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
