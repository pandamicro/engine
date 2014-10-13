(function () {
    
    // editor functions for H5 RenderContext

    /**
     * @param {Fire.Renderer} renderer
     * @returns {PIXI.DisplayObject}
     */
    RenderContext.prototype.getDisplayObject = function (renderer) {
        var isSceneView = this.sceneView;
        return isSceneView ? renderer._renderObjInScene : renderer._renderObj;
    };

    /**
     * A debug method whick checks whether the render context matches the current scene.
     * @param {boolean} [fastCheck=false]
     * @returns {boolean}
     */
    RenderContext.prototype.checkMatchCurrentScene = function (fastCheck) {
        var entities = Engine._scene.entities;
        var pixiGameNodes = this.stage.children;
        var pixiSceneNodes;
        if (this.sceneView) {
            pixiSceneNodes = this.sceneView.stage.children;
        }
        if (pixiSceneNodes && pixiSceneNodes.length !== entities.length) {
            Fire.error('root elements count not matched in scene view');
            return false;
        }
        if (fastCheck) {
            if (pixiGameNodes.length !== entities.length) {
                Fire.error('root elements count not matched in game view');
                return false;
            }
            return true;
        }
        //var g = 0;
        for (var i = 0; i < entities.length; i++) {
            var ent = entities[i];
            if (pixiSceneNodes) {
                var sceneNode = pixiSceneNodes[i];
                if (ent.transform._pixiObjInScene !== sceneNode) {
                    Fire.error('root transform does not match pixi scene node: ' + ent.name);
                    return false;
                }
            }
            //if (!(ent._objFlags & SceneGizmo)) {
            //    var gameNode = pixiGameNodes[g++];
            //}
            var gameNode = pixiGameNodes[i];
            if (ent.transform._pixiObj !== gameNode) {
                Fire.error('root transform does not match pixi game node: ' + ent.name);
                return false;
            }
        }
        //if (g !== pixiGameNodes.length) {
        //    Fire.error('pixi has extra game node, pixi count: ' + pixiGameNodes.length + ' expected count: ' + g);
        //    return false;
        //}
        // 目前不测试renderer
        return true;
    };

    var doAddSprite = RenderContext.prototype.addSprite;
    RenderContext.prototype.addSprite = function (target) {
        doAddSprite.call(this, target);
        if (target._renderObjInScene) {
            target._renderObjInScene.entityId = target.entity.hashKey;
        }
    };

})();
