(function () {

    Engine.createSceneView = function (width, height, canvas) {
        return RenderContext.createSceneRenderCtx (width, height, canvas, true);
    };

    Engine.createInteractionContext = function () {
        return new InteractionContext();
    };
})();
