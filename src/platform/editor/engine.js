(function () {
    ///**
    // * @param {number} [width]
    // * @param {number} [height]
    // * @param {Canvas} [canvas]
    // * @param {boolean} [showGizmos=false] - allow display the object which marked as Fire._ObjectFlags.SceneGizmo
    // * @returns {RenderContext}
    // */
    //Engine.createViewport = function (width, height, canvas, showGizmo) {
    //    return new RenderContext (width, height, canvas, showGizmo);
    //};

    Engine.createSceneView = function (width, height, canvas) {
        var sceneCtx = new RenderContext (width, height, canvas);
        Engine._renderContext.sceneView = sceneCtx;
        return sceneCtx;
    };

})();
