var SpriteRenderer = (function () {

    var SpriteRenderer = Fire.extend('Fire.SpriteRenderer', Renderer, function () {
        Renderer.call(this);
        RenderContext.initRenderer(this);
        this._hasRenderObj = false;
    });
    Fire.addComponentMenu(SpriteRenderer, 'SpriteRenderer');
    Fire.executeInEditMode(SpriteRenderer);

    SpriteRenderer.prop('_sprite', null, Fire.HideInInspector);
    SpriteRenderer.getset('sprite',
        function () {
            return this._sprite;
        },
        function (value) {
            this._sprite = value;
            if (this._hasRenderObj) {
                Engine._renderContext.updateMaterial(this);
            }
        },
        Fire.ObjectType(Fire.Sprite)
    );

    SpriteRenderer.prop('_color', new Fire.Color(1, 1, 1, 1), Fire.HideInInspector);
    SpriteRenderer.getset('color',
        function () {
            return this._color;
        },
        function (value) {
            this._color = value;
            if (this._hasRenderObj) {
                Engine._renderContext.updateSpriteColor(this);
            }
        }
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
                return Fire.isValid(this._sprite) ? this._sprite.width : 0;
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
                return Fire.isValid(this._sprite) ? this._sprite.height : 0;
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
        this._hasRenderObj = true;
    };
    SpriteRenderer.prototype.onEnable = function () {
        Engine._renderContext.show(this, true);
    };
    SpriteRenderer.prototype.onDisable = function () {
        Engine._renderContext.show(this, false);
    };

    SpriteRenderer.prototype.getWorldSize = function () {
        return new Fire.Vec2(this.width, this.height);
    };

    var tempMatrix = new Fire.Matrix23();

    SpriteRenderer.prototype.onPreRender = function () {
        this.getSelfMatrix(tempMatrix);
        if (this._sprite && this._sprite.rotated) {
            // rotate cw
            tempMatrix.b = tempMatrix.d;
            tempMatrix.c = -tempMatrix.a;
            tempMatrix.a = 0;
            tempMatrix.d = 0;
            tempMatrix.ty -= this.height;
        }
        tempMatrix.prepend(this.transform._worldTransform);
        Engine._curRenderContext.updateTransform(this, tempMatrix);
    };
    SpriteRenderer.prototype.onDestroy = function () {
        Engine._renderContext.remove(this);
    };

    // 返回表示 sprite 的 width/height/pivot/skew/shear 等变换的 matrix，
    // 由于这些变换不影响子物体，所以不能放到 getLocalToWorldMatrix
    SpriteRenderer.prototype.getSelfMatrix = function (out) {
        var w = this.width;
        var h = this.height;

        var pivotX = 0.5;
        var pivotY = 0.5;
        var scaleX = 1;
        var scaleY = 1;
        //var rotated = false;
        if (Fire.isValid(this._sprite)) {
            //rotated = this._sprite.rotated;
            pivotX = this._sprite.pivot.x;
            pivotY = this._sprite.pivot.y;
            scaleX = w / this._sprite.width;
            scaleY = h / this._sprite.height;
        }

        //if ( !rotated ) {
            out.a = scaleX;
            out.b = 0;
            out.c = 0;
            out.d = scaleY;
            out.tx = - pivotX * w;
            out.ty = (1.0 - pivotY) * h;
        //}
        //else {
        //    // CCW
        //    //out.a = 0;
        //    //out.b = scaleY;
        //    //out.c = -scaleX;
        //    //out.d = 0;
        //    //out.tx = - (pivotY - 1.0) * w;
        //    //out.ty = - pivotX * h;
        //
        //    // CW
        //    out.a = 0;
        //    out.b = -scaleY;
        //    out.c = scaleX;
        //    out.d = 0;
        //    out.tx = (1.0 - pivotX) * w;
        //    out.ty = (1.0 - pivotY) * h;
        //}
    };

    return SpriteRenderer;
})();

Fire.SpriteRenderer = SpriteRenderer;
