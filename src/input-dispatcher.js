/**
 * 
 */
var InputDispatcher = (function () {

    var InputDispatcher = {};

    InputDispatcher.dispatchMouseEvent = function (event, inputContext) {
        var camera = inputContext.renderContext.camera || Engine._scene.camera;
        var worldMousePos = camera.screenToWorld(new Vec2(event.screenX, event.screenY));
        var target = Engine._interactionContext.pick(worldMousePos);
        if (target) {
            target.dispatchEvent(event);
        }
    };

    InputDispatcher.dispatchKeyEvent = function (event, inputContext) {
        console.log('key:');
        console.log(event);
    };

    InputDispatcher.dispatchEvent = function (event, inputContext) {
        if (event instanceof Fire.MouseEvent) {
            this.dispatchMouseEvent(event, inputContext);
        }
        else if (event instanceof Fire.KeyboardEvent) {
            this.dispatchKeyEvent(event, inputContext);
        }
    };

    return InputDispatcher;
})();
