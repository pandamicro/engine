var SpriteRenderer = (function () {

    var SpriteRenderer = Fire.define('Fire.SpriteRenderer', Renderer, function () {
        Renderer.call(this);
        RenderContext.initRenderer(this);
    });
    Fire.addComponentMenu(SpriteRenderer, 'SpriteRenderer');

    SpriteRenderer.prop('_sprite', null, Fire.HideInInspector);
    SpriteRenderer.getset('sprite',
        function () {
            return this._sprite;
        },
        function (value) {
            this._sprite = value;
            Engine._renderContext.updateMaterial(this);
        },
        Fire.ObjectType(Fire.Sprite)
    );

    // built-in functions

    SpriteRenderer.prototype.onLoad = function () {
        Engine._renderContext.addSprite(this);
    };
    SpriteRenderer.prototype.onEnable = function () {
        Engine._renderContext.show(this, true);
    };
    SpriteRenderer.prototype.onDisable = function () {
        Engine._renderContext.show(this, false);
    };
    SpriteRenderer.prototype.onPreRender = function () {
        Engine._curRenderContext.updateTransform(this);
    };
    SpriteRenderer.prototype.onDestroy = function () {
        Engine._renderContext.remove(this);
    };
    //SpriteRenderer.prototype.onHierarchyChanged = function (transform, oldParent) {
    //    return Engine._renderContext.updateHierarchy(this, transform, oldParent);
    //};

    // override
    function _doGetOrientedBounds(mat, bl, tl, tr, br) {
        var width = this._sprite ? this._sprite.width : 0;
        var height = this._sprite ? this._sprite.height : 0;

        // transform rect(0, 0, width, height) by matrix
        var tx = mat.tx;
        var ty = mat.ty;
        var xa = mat.a * width;
        var xb = mat.b * width;
        var yc = mat.c * - height;
        var yd = mat.d * - height;

        tl.x = tx;
        tl.y = ty;
        tr.x = xa + tx;
        tr.y = xb + ty;
        bl.x = yc + tx;
        bl.y = yd + ty;
        br.x = xa + yc + tx;
        br.y = xb + yd + ty;

        // above scripts should equivalent to:
        //tl.set(mat.transformPoint(new Vec2(0, 0)));
        //tr.set(mat.transformPoint(new Vec2(width, 0)));
        //bl.set(mat.transformPoint(new Vec2(0, -height)));
        //br.set(mat.transformPoint(new Vec2(width, -height)));
    }

    function _doGetBounds(mat, out) {
        var bl = new Vec2(0, 0);
        var tl = new Vec2(0, 0);
        var tr = new Vec2(0, 0);
        var br = new Vec2(0, 0);
        _doGetOrientedBounds.call(this, mat, bl, tl, tr, br);

        // caculate max rect
        out = out || new Fire.Rect();
        var minX = Math.min(tl.x, tr.x, bl.x, br.x);
        var maxX = Math.max(tl.x, tr.x, bl.x, br.x);
        var minY = Math.min(tl.y, tr.y, bl.y, br.y);
        var maxY = Math.max(tl.y, tr.y, bl.y, br.y);
        out.x = minX;
        out.y = minY;
        out.width = maxX - minX;
        out.height = maxY - minY;
        return out;
    }

    SpriteRenderer.prototype.getWorldBounds = function (out) {
        var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
        return _doGetBounds.call(this, worldMatrix, out);
    };

    /**
     * Returns a "world" oriented bounding box(OBB) of the renderer.
     * 
     * @function Fire.SpriteRenderer#getWorldOrientedBounds
     * @param {Fire.Vec2} [out1] - optional, the vector to receive the 1st world position
     * @param {Fire.Vec2} [out2] - optional, the vector to receive the 2nd world position
     * @param {Fire.Vec2} [out3] - optional, the vector to receive the 3rd world position
     * @param {Fire.Vec2} [out4] - optional, the vector to receive the 4th world position
     * @returns {Fire.Vec2[]} - the array contains four vectors represented in world position
     */
    SpriteRenderer.prototype.getWorldOrientedBounds = function (out1, out2, out3, out4) {
        out1 = out1 || new Vec2(0, 0);
        out2 = out2 || new Vec2(0, 0);
        out3 = out3 || new Vec2(0, 0);
        out4 = out4 || new Vec2(0, 0);
        var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
        _doGetOrientedBounds.call(this, worldMatrix, out1, out2, out3, out4);
        return [out1, out2, out3, out4];
    };

    // other functions

    return SpriteRenderer;
})();

Fire.SpriteRenderer = SpriteRenderer;
