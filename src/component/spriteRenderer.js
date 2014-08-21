var SpriteRenderer = (function () {
    var _super = Component;

    // constructor
    function SpriteRenderer () {
        _super.call(this);
        init(this);
    }
    FIRE.extend(SpriteRenderer, _super);
    SpriteRenderer.prototype.__classname__ = "FIRE.SpriteRenderer";

    // init
    var init = function (self) {
        self._sprite = null;
    };

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
