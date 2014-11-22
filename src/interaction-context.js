/**
 * The interaction 
 */
var InteractionContext = (function () {

    function InteractionContext () {
        this.boundings = [];    // sort from back to front
    }

    InteractionContext.prototype.add = function ( entity, aabb, obb ) {
        this.boundings.push( { entity: entity, aabb: aabb, obb: obb } );
    };

    InteractionContext.prototype.clear = function () {
        this.boundings.length = 0;
    };

    /**
     * Pick the top most entity, using their oriented bounding boxes.
     * @param {Fire.Vec2} worldPosition
     * @returns {Fire.Entity}
     */
    InteractionContext.prototype.pick = function (worldPosition) {
        for (var i = this.boundings.length - 1; i >= 0; --i) {
            bounding = this.boundings[i];
            // aabb test
            if (bounding.aabb.contains(worldPosition)) {
                // obb test
                var polygon = new Fire.Polygon(bounding.obb);
                if (polygon.contains(worldPosition)) {
                    return bounding.entity;
                }
            }
        }
        return null;
    };

    return InteractionContext;
})();

Fire._InteractionContext = InteractionContext;
