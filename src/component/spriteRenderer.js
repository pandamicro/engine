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

    function _doGetBounds(mat, out) {
        var width = this._sprite ? this._sprite.width : 0;
        var height = this._sprite ? this._sprite.height : 0;

        // transform rect(0, 0, width, height) by matrix
        
        var tl = mat.transformPoint(new Vec2(0, 0));
        var tr = mat.transformPoint(new Vec2(width, 0));
        var bl = mat.transformPoint(new Vec2(0, -height));
        var br = mat.transformPoint(new Vec2(width, -height));

        var topLeftX = tl.x;
        var topLeftY = tl.y;
        var topRightX = tr.x;
        var topRightY = tr.y;
        var bottomLeftX = bl.x;
        var bottomLeftY = bl.y;
        var bottomRightX = br.x;
        var bottomRightY = br.y;

        //var tx = mat.tx;
        //var ty = mat.ty;
        //var xa = mat.a * width;
        //var xb = mat.b * width;
        //var yc = mat.c * - height;
        //var yd = mat.d * - height;

        //var topLeftX = tx;
        //var topLeftY = ty;
        //var topRightX = xa + tx;
        //var topRightY = xb + ty;
        //var bottomLeftX = yc + tx;
        //var bottomLeftY = yd + ty;
        //var bottomRightX = xa + yc + tx;
        //var bottomRightY = xb + yd + ty;
        
        // caculate max aabb rect

        var minX = Math.min(topLeftX, topRightX, bottomLeftX, bottomRightX);
        var maxX = Math.max(topLeftX, topRightX, bottomLeftX, bottomRightX);
        var minY = Math.min(topLeftY, topRightY, bottomLeftY, bottomRightY);
        var maxY = Math.max(topLeftY, topRightY, bottomLeftY, bottomRightY);

        out = out || new Fire.Rect();
        out.x = minX;
        out.y = minY;
        out.width = maxX - minX;
        out.height = maxY - minY;
        return out;
    }

    SpriteRenderer.prototype.getLocalBounds = function (out) {
        var localMatrix = this.entity.transform.getLocalMatrix();
        return _doGetBounds.call(this, localMatrix, out);
    };

    SpriteRenderer.prototype.getWorldBounds = function (out) {
        var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
        return _doGetBounds.call(this, worldMatrix, out);
    };

    // other functions

    return SpriteRenderer;
})();

Fire.SpriteRenderer = SpriteRenderer;
