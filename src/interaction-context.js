/**
 * The interaction 
 */
var InteractionContext = (function () {

    function InteractionContext () {
        this.boundings = [];
    }

    InteractionContext.prototype.add = function ( entity, aabb ) {
        this.boundings.push( { entity: entity, aabb: aabb } );
    };

    InteractionContext.prototype.clear = function () {
        this.boundings.length = 0;
    };

    return InteractionContext;
})();
