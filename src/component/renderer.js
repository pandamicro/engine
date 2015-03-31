var Renderer = (function () {

    /**
     * The base for all renderer
     * @class Renderer
     * @extends HashObject
     * @constructor
     */
    var Renderer = Fire.extend('Fire.Renderer', Component);

    ///**
    // * Returns a "local" axis aligned bounding box(AABB) of the renderer.
    // * The returned box is relative only to its parent.
    // *
    // * @function Fire.Renderer#getLocalBounds
    // * @param {Rect} [out] - optional, the receiving rect
    // * @return {Rect}
    // */
    //Renderer.prototype.getLocalBounds = function (out) {
    //    Fire.warn('interface not yet implemented');
    //    return new Fire.Rect();
    //};

    var tempMatrix = new Fire.Matrix23();

    /**
     * Returns a "world" axis aligned bounding box(AABB) of the renderer.
     *
     * @method getWorldBounds
     * @param {Rect} [out] - optional, the receiving rect
     * @return {Rect} - the rect represented in world position
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
     * @method getWorldOrientedBounds
     * @param {Vec2} [out_bl] - optional, the vector to receive the world position of bottom left
     * @param {Vec2} [out_tl] - optional, the vector to receive the world position of top left
     * @param {Vec2} [out_tr] - optional, the vector to receive the world position of top right
     * @param {Vec2} [out_br] - optional, the vector to receive the world position of bottom right
     * @return {Vec2} - the array contains vectors represented in world position,
     *                    in the sequence of BottomLeft, TopLeft, TopRight, BottomRight
     */
    Renderer.prototype.getWorldOrientedBounds = function (out_bl, out_tl, out_tr, out_br){
        out_bl = out_bl || new Vec2(0, 0);
        out_tl = out_tl || new Vec2(0, 0);
        out_tr = out_tr || new Vec2(0, 0);
        out_br = out_br || new Vec2(0, 0);
        var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
        _doGetOrientedBounds.call(this, worldMatrix, out_bl, out_tl, out_tr, out_br);
        return [out_bl, out_tl, out_tr, out_br];
    };

    /**
     * !#zh 返回表示 renderer 的 width/height/pivot/skew/shear 等变换的 matrix，
     * 这些变换不影响子物体，getLocalToWorldMatrix 返回的变换会影响子物体。
     *
     * @method getSelfMatrix
     * @param {Matrix23} out - the receiving matrix
     */
    Renderer.prototype.getSelfMatrix = function (out) {
    };

    /**
     * @method getWorldSize
     * @return {Vec2}
     */
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
