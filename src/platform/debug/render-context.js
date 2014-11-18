(function () {
    
    /**
     * The debugging method that checks whether the render context matches the current scene or not.
     * @throws {string} error info
     */
    RenderContext.prototype.checkMatchCurrentScene = function () {
        var entities = Engine._scene.entities;
        var pixiGameNodes = this.stage.children;
        var pixiSceneNodes;
        if (this.sceneView) {
            pixiSceneNodes = this.sceneView.stage.children;
            pixiSceneNodes = pixiSceneNodes[1].children;    // skip forground and background
        }
        
        function checkMatch (ent, gameNode, sceneNode) {
            if (sceneNode && ent._pixiObjInScene !== sceneNode) {
                throw new Error('entity does not match pixi scene node: ' + ent.name);
            }
            //if (!(ent._objFlags & HideInGame)) {
            //    var gameNode = gameNodes[g++];
            //}
            if (ent._pixiObj !== gameNode) {
                throw new Error('entity does not match pixi game node: ' + ent.name);
            }

            var childCount = ent._children.length;
            var sceneChildrenOffset;
            if (sceneNode) {
                sceneChildrenOffset = RenderContext._getChildrenOffset(ent, true);
                if (sceneNode.children.length !== childCount + sceneChildrenOffset) {
                    throw new Error('Mismatched list of child elements in scene view, entity: ' + ent.name);
                }
            }
            var gameChildrenOffset = RenderContext._getChildrenOffset(ent, false);
            if (gameNode.children.length !== childCount + gameChildrenOffset) {
                throw new Error('Mismatched list of child elements in game view, entity: ' + ent.name);
            }
            for (var i = 0; i < childCount; i++) {
                checkMatch(ent._children[i], gameNode.children[gameChildrenOffset + i], sceneNode && sceneNode.children[i + sceneChildrenOffset]);
            }
        }

        for (var i = 0; i < entities.length; i++) {
            if (pixiSceneNodes && pixiSceneNodes.length !== entities.length) {
                throw new Error('Mismatched list of root elements in scene view');
            }
            if (pixiGameNodes.length !== entities.length) {
                throw new Error('Mismatched list of root elements in game view');
            }
            checkMatch(entities[i], pixiGameNodes[i], pixiSceneNodes && pixiSceneNodes[i]);
        }

        //if (g !== pixiGameNodes.length) {
        //    Fire.error('pixi has extra game node, pixi count: ' + pixiGameNodes.length + ' expected count: ' + g);
        //    return false;
        //}
        // 目前不测试renderer
    };

})();
