var Renderer = (function () {

    /**
     * The base for all renderer
     */
    var Renderer = Fire.define('Fire.Renderer', Component);

    /**
     * Returns a "local" axis aligned bounding box of the renderer.
     * The returned box is relative only to its parent.
     * 
     * @function Fire.Renderer#getLocalBounds
     * @param {Fire.Rect} [out] - optional, the receiving rect
     * @returns {Fire.Rect}
     */
    Renderer.prototype.getLocalBounds = function (out) {
        Fire.warn('interface not yet implemented');
        return new Fire.Rect();
    };

    /**
     * Returns a "world" axis aligned bounding box of the renderer.
     * The returned box is relative only to its parent.
     * 
     * @function Fire.Renderer#getWorldBounds
     * @param {Fire.Rect} [out] - optional, the receiving rect
     * @returns {Fire.Rect} - the rect represented in world position
     */
    Renderer.prototype.getWorldBounds = function (out) {
        Fire.warn('interface not yet implemented');
        return new Fire.Rect();
    };

    return Renderer;
})();

Fire.Renderer = Renderer;
