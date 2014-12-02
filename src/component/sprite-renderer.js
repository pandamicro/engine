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

    SpriteRenderer.prop('customSize_', false, Fire.HideInInspector);
    SpriteRenderer.getset('customSize',
        function () {
            return this.customSize_;
        },
        function (value) {
            this.customSize_ = value;
        }
    );

    SpriteRenderer.prop('width_', 100, Fire.DisplayName('Width'), 
                        Fire.Watch( 'customSize_', function ( obj, propEL ) {
                            propEL.disabled = !obj.customSize; 
                        } ));
    SpriteRenderer.getset('width',
        function () {
            if ( !this.customSize_ ) {
                return FObject.isValid(this._sprite) ? this._sprite.width : 0;
            }
            else {
                return this.width_;
            }
        },
        function (value) {
            this.width_ = value;
        },
        Fire.HideInInspector
    );

    SpriteRenderer.prop('height_', 100, Fire.DisplayName('Height'),
                        Fire.Watch( 'customSize_', function ( obj, propEL) {
                            propEL.disabled = !obj.customSize;
                        } ));
    SpriteRenderer.getset('height',
        function () {
            if ( !this.customSize_ ) {
                return FObject.isValid(this._sprite) ? this._sprite.height : 0;
            }
            else {
                return this.height_;
            }
        },
        function (value) {
            this.height_ = value;
        },
        Fire.HideInInspector
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

    var tempMatrix = new Fire.Matrix23();

    SpriteRenderer.prototype.onPreRender = function () {
        this.getSelfMatrix(tempMatrix);
        tempMatrix.prepend(this.transform._worldTransform);
        Engine._curRenderContext.updateTransform(this, tempMatrix);
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
        
        this.getSelfMatrix(tempMatrix);
        mat = tempMatrix.prepend(mat);
        
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

    // 返回表示 sprite 的 width/height/pivot/skew/shear 等变换的 matrix，
    // 由于这些变换不影响子物体，所以不能放到 getLocalToWorldMatrix
    SpriteRenderer.prototype.getSelfMatrix = function (out) {
        var w = this.width;
        var h = this.height;

        var pivotX = 0.5;
        var pivotY = 0.5;
        var scaleX = 1;
        var scaleY = 1;
        if (FObject.isValid(this._sprite)) {
            pivotX = this._sprite.pivot.x;
            pivotY = this._sprite.pivot.y;
            scaleX = w / this._sprite.width;
            scaleY = h / this._sprite.height;
        }
        
        out.tx = - pivotX * w;
        out.ty = (1.0 - pivotY) * h;
        out.a = scaleX;
        out.b = 0;
        out.c = 0;
        out.d = scaleY;
    };

    SpriteRenderer.prototype.getWorldBounds = function (out) {
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
