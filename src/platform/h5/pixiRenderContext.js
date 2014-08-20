/**
 * The web renderer implemented rely on pixi.js
 */
RenderContext = (function () {

    /**
     * @param screenSize {FIRE.Vec2}
     */
    function RenderContext (screenSize, canvas) {
        screenSize = screenSize || new FIRE.Vec2(800, 600);
        PIXI.dontSayHello = true;
        this.stage = new PIXI.Stage(0x000000);
        this.renderer = PIXI.autoDetectRenderer(screenSize.x, screenSize.y, canvas);
    }

    RenderContext.prototype.__defineGetter__('element', function () {
        return this.renderer.view;
    });

    RenderContext.prototype.__defineGetter__('size', function () {
        return new FIRE.Vec2(this.renderer.width, this.renderer.height);
    });
    RenderContext.prototype.__defineSetter__('size', function (value) {
        return this.renderer.resize(value.x, value.y);
    });

    RenderContext.prototype.render = function () {
        this.renderer.render(this.stage);
    };

    return RenderContext;
})();

FIRE.__TESTONLY__.RenderContext = RenderContext;
