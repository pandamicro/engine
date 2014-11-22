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

    return InteractionContext;
})();

Fire._InteractionContext = InteractionContext;
