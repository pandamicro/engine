
var BitmapText = (function () {

    var TextAlign = (function (t) {
        t[t.left = 0] = 'left';
        t[t.center = 1] = 'center';
        t[t.right = 2] = 'right';
        return t;
    })({});

    var TextAnchor = (function (t) {
        t[t.topLeft = 0] = 'topLeft';
        t[t.topCenter = 1] = 'topCenter';
        t[t.topRight = 2] = 'topRight';
        t[t.middleLeft = 3] = 'middleLeft';
        t[t.middleCenter = 4] = 'middleCenter';
        t[t.middleRight = 5] = 'middleRight';
        t[t.bottomLeft = 6] = 'bottomLeft';
        t[t.bottomCenter = 7] = 'bottomCenter';
        t[t.bottomRight = 8] = 'bottomRight';
        return t;
    })({});


    //-- 增加 Bitmap Text 到 组件菜单上
    var BitmapText = Fire.define("Fire.BitmapText", Renderer, function () {
        Renderer.call(this);
        RenderContext.initRenderer(this);
    });

    BitmapText.TextAlign = TextAlign;
    BitmapText.TextAnchor = TextAnchor;

    //-- 增加 Bitmap Text 到 组件菜单上
    Fire.addComponentMenu(BitmapText, 'BitmapText');

    BitmapText.prop('_text', 'hello\nworld!', Fire.HideInInspector);
    BitmapText.getset('text',
        function () {
            return this._text;
        },
        function (value) {
            if (this._text !== value) {
                this._text = value;
                Engine._renderContext.setText(this, value);
            }
        }
    );

    BitmapText.prop('_bitmapFont', null, Fire.HideInInspector);
    BitmapText.getset('bitmapFont',
        function () {
            return this._bitmapFont;
        },
        function (value) {
            if (this._bitmapFont !== value) {
                this._bitmapFont = value;
                this.face = this._bitmapFont ? this._bitmapFont.face : 'None';
                Engine._renderContext.setBitmapFont(this);
            }
        },
        Fire.ObjectType(Fire.BitmapFont)
    );

    BitmapText.prop('_anchor', BitmapText.TextAnchor.middleCenter, Fire.HideInInspector);
    BitmapText.getset('anchor',
        function () {
            return this._anchor;
        },
        function (value) {
            if (this._anchor !== value) {
                this._anchor = value;
            }
        },
        Fire.Enum(BitmapText.TextAnchor)
    );

    BitmapText.prop('_align', BitmapText.TextAlign.left, Fire.HideInInspector);
    BitmapText.getset('align',
        function () {
            return this._align;
        },
        function (value) {
            if (this._align !== value) {
                this._align = value;
                Engine._renderContext.setAlign(this, value);
            }
        },
        Fire.Enum(BitmapText.TextAlign)
    );

    BitmapText.prototype.onLoad = function () {
        Engine._renderContext.addBitmapText(this);
    };

    BitmapText.prototype.onEnable = function () {
        Engine._renderContext.show(this, true);
    };
    
    BitmapText.prototype.onDisable = function () {
        Engine._renderContext.show(this, false);
    };

    BitmapText.prototype.onDestroy = function () {
        Engine._renderContext.remove(this);
    };

    BitmapText.prototype.getWorldSize = function () {
        var size = new Fire.Vec2(0, 0);
        size.x = this._renderObj ? this._renderObj.textWidth : 0;
        size.y = this._renderObj ? this._renderObj.textHeight : 0;
        return size;
    };

    var tempMatrix = new Fire.Matrix23();

    BitmapText.prototype.onPreRender = function () {
        this.getSelfMatrix(tempMatrix);
        tempMatrix.prepend(this.transform._worldTransform);
        PixiBitmapFontUtil.updateTransform(this, tempMatrix);
    };
    
    BitmapText.prototype.getSelfMatrix = function (out) {
        var w = this._renderObj ? this._renderObj.textWidth : 0;
        var h = this._renderObj ? this._renderObj.textHeight : 0;

        var anchorOffset = {
            tx:0,
            ty:0
        };

        switch (this._anchor) {
            case BitmapText.TextAnchor.topLeft:
                anchorOffset.tx = 0;
                anchorOffset.ty = 0;
                break;
            case BitmapText.TextAnchor.topCenter:
                anchorOffset.tx -= w * 0.5;
                anchorOffset.ty = 0;
                break;
            case BitmapText.TextAnchor.topRight:
                anchorOffset.tx -= w;
                anchorOffset.ty = 0;
                break;
            case BitmapText.TextAnchor.middleLeft:
                anchorOffset.tx = 0;
                anchorOffset.ty = h * (1.0 - 0.5);
                break;
            case BitmapText.TextAnchor.middleCenter:
                anchorOffset.tx -= w * 0.5;
                anchorOffset.ty = h * (1.0 - 0.5);
                break;
            case BitmapText.TextAnchor.middleRight:
                anchorOffset.tx -= w;
                anchorOffset.ty = h * (1.0 - 0.5) ;
                break;
            case BitmapText.TextAnchor.bottomLeft:
                anchorOffset.tx = 0;
                anchorOffset.ty = h;
                break;
            case BitmapText.TextAnchor.bottomCenter:
                anchorOffset.tx -= w * 0.5;
                anchorOffset.ty = h;
                break;
            case BitmapText.TextAnchor.bottomRight:
                anchorOffset.tx -= w;
                anchorOffset.ty = h;
                break;
            default:
                break;
        }
        out.a = 1;
        out.b = 0;
        out.c = 0;
        out.d = 1;
        out.tx = anchorOffset.tx;
        out.ty = anchorOffset.ty;
    };

    return BitmapText;
})();

Fire.BitmapText = BitmapText;
