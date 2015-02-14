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
    // * @return {Fire.Rect}
    // */
    //Renderer.prototype.getLocalBounds = function (out) {
    //    Fire.warn('interface not yet implemented');
    //    return new Fire.Rect();
    //};

    var tempMatrix = new Fire.Matrix23();

    /**
     * Returns a "world" axis aligned bounding box(AABB) of the renderer.
     *
     * @function Fire.Renderer#getWorldBounds
     * @param {Fire.Rect} [out] - optional, the receiving rect
     * @return {Fire.Rect} - the rect represented in world position
     */
    Renderer.prototype.getWorldBounds = function (out) {
        var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
        var bl = new Vec2(0, 0);
        var tl = new Vec2(0, 0);
        var tr = new Vec2(0, 0);
        var br = new Vec2(0, 0);
        _doGetOrientedBounds.call(this, worldMatrix, bl, tl, tr, br);
        out = out || new Rect();
        Math.calculateMaxRect(out, bl, tl, tr, br);
        return out;
    };

    /**
     * Returns a "world" oriented bounding box(OBB) of the renderer.
     *
     * @function Fire.Renderer#getWorldOrientedBounds
     * @param {...Fire.Vec2} [out] - optional, the vector to receive the world position
     * @return {Fire.Vec2[]} - the array contains vectors represented in world position
     */
    Renderer.prototype.getWorldOrientedBounds = function (out1, out2, out3, out4){
        out1 = out1 || new Vec2(0, 0);
        out2 = out2 || new Vec2(0, 0);
        out3 = out3 || new Vec2(0, 0);
        out4 = out4 || new Vec2(0, 0);
        var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
        _doGetOrientedBounds.call(this, worldMatrix, out1, out2, out3, out4);
        return [out1, out2, out3, out4];
    };

    Renderer.prototype.getSelfMatrix = function (out) {
    };

    Renderer.prototype.getWorldSize = function () {
        return new Vec2(0, 0);
    };

    function _doGetOrientedBounds(mat, bl, tl, tr, br) {
        var size = this.getWorldSize();
        var width = size.x;
        var height = size.y;

        this.getSelfMatrix(tempMatrix);
        mat = tempMatrix.prepend(mat);

        // transform rect(0, 0, width, height) by matrix
        var tx = mat.tx;
        var ty = mat.ty;
        var xa = mat.a * width;
        var xb = mat.b * width;
        var yc = mat.c * -height;
        var yd = mat.d * -height;

        tl.x = tx;
        tl.y = ty;
        tr.x = xa + tx;
        tr.y = xb + ty;
        bl.x = yc + tx;
        bl.y = yd + ty;
        br.x = xa + yc + tx;
        br.y = xb + yd + ty;
    }

    return Renderer;
})();

Fire.Renderer = Renderer;
