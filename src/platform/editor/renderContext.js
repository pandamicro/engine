(function () {
    
    // editor functions for H5 RenderContext

    /**
     * @param {FIRE.Renderer} renderer
     * @returns {PIXI.DisplayObject}
     */
    RenderContext.prototype.getDisplayObject = function (renderer) {
        var isSceneView = this.sceneView;
        return isSceneView ? renderer._renderObjInScene : renderer._renderObj;
    };

    /**
     * A debug method whick checks whether the render context matches the current scene.
     * @returns {boolean}
     */
    RenderContext.prototype.checkMatchCurrentScene = function () {
        var entities = Engine._scene.entities;
        var pixiGameNodes = this.stage.children;
        var pixiSceneNodes;
        if (this.sceneView) {
            pixiSceneNodes = this.sceneView.stage.children;
        }
        if (pixiSceneNodes && pixiSceneNodes.length !== entities.length) {
            console.error('root elements count not matched in scene view');
            return false;
        }
        var g = 0;
        for (var i = 0; i < entities.length; i++) {
            var ent = entities[i];
            if (pixiSceneNodes) {
                var sceneNode = pixiSceneNodes[i];
                if (ent.transform._pixiObjInScene !== sceneNode) {
                    console.error('root transform does not match pixi scene node: ' + ent.name);
                    return false;
                }
            }
            if (!(ent._objFlags & SceneGizmo)) {
                var gameNode = pixiGameNodes[g++];
                if (ent.transform._pixiObj !== gameNode) {
                    console.error('root transform does not match pixi game node: ' + ent.name);
                    return false;
                }
            }
        }
        if (g !== pixiGameNodes.length) {
            console.error('pixi has extra game node, pixi count: ' + pixiGameNodes.length + ' expected count: ' + g);
            return false;
        }
        // 目前不测试renderer
        return true;
    };

})();
