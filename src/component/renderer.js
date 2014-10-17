var Renderer = (function () {

    /**
     * The base for all renderer
     */
    var Renderer = Fire.define('Fire.Renderer', Component);

    ///**
    // * Returns a "local" axis aligned bounding box(AABB) of the renderer.
    // * The returned box is relative only to its parent.
    // * 
    // * @function Fire.Renderer#getLocalBounds
    // * @param {Fire.Rect} [out] - optional, the receiving rect
    // * @returns {Fire.Rect}
    // */
    //Renderer.prototype.getLocalBounds = function (out) {
    //    Fire.warn('interface not yet implemented');
    //    return new Fire.Rect();
    //};

    /**
     * Returns a "world" axis aligned bounding box(AABB) of the renderer.
     * 
     * @function Fire.Renderer#getWorldBounds
     * @param {Fire.Rect} [out] - optional, the receiving rect
     * @returns {Fire.Rect} - the rect represented in world position
     */
    Renderer.prototype.getWorldBounds = function (out) {
        Fire.warn('interface not yet implemented');
        return new Fire.Rect();
    };

    /**
     * Returns a "world" oriented bounding box(OBB) of the renderer.
     * 
     * @function Fire.Renderer#getWorldOrientedBounds
     * @param {Fire.Vec2} [out1] - optional, the vector to receive the 1st world position 
     * @param {Fire.Vec2} [out2] - optional, the vector to receive the 2nd world position
     * @param {Fire.Vec2} [out3] - optional, the vector to receive the 3rd world position
     * @param {Fire.Vec2} [out4] - optional, the vector to receive the 4th world position
     * @returns {Fire.Vec2[]} - the array contains four vectors represented in world position
     */
    Renderer.prototype.getWorldOrientedBounds = function (out1, out2, out3, out4) {
        Fire.warn('interface not yet implemented');
        return [out1, out2, out3, out4];
    };

    return Renderer;
})();

Fire.Renderer = Renderer;
