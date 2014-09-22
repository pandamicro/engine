(function () {
    
    // editor functions for H5 RenderContext

    /**
     * @param {FIRE.Renderer} renderer
     * @returns {PIXI.DisplayObject}
     */
    RenderContext.prototype.getDisplayObject = function (renderer) {
        var isSceneView = this.scene;
        return isSceneView ? renderer._renderObjInScene : renderer._renderObj;
    };

})();
