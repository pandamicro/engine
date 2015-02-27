
var BitmapText = (function () {

    var TextAlign = (function (t) {
        t[t.left = 0] = 'Left';
        t[t.center = 1] = 'Center';
        t[t.right = 2] = 'Right';
        return t;
    })({});

    var TextAnchor = (function (t) {
        t[t.topLeft = 0] = 'Top Left';
        t[t.topCenter = 1] = 'Top Center';
        t[t.topRight = 2] = 'Top Right';
        t[t.midLeft = 3] = 'Middle Left';
        t[t.midCenter = 4] = 'Middle Center';
        t[t.midRight = 5] = 'Middle Right';
        t[t.botLeft = 6] = 'Bottom Left';
        t[t.botCenter = 7] = 'Bottom Center';
        t[t.botRight = 8] = 'Bottom Right';
        return t;
    })({});


    //-- 增加 Bitmap Text 到 组件菜单上
    var BitmapText = Fire.extend("Fire.BitmapText", Renderer, function () {
        RenderContext.initRenderer(this);
    });

    BitmapText.TextAlign = TextAlign;
    BitmapText.TextAnchor = TextAnchor;

    //-- 增加 Bitmap Text 到 组件菜单上
    Fire.addComponentMenu(BitmapText, 'BitmapText');
    Fire.executeInEditMode(BitmapText);

    BitmapText.prop('_bitmapFont', null, Fire.HideInInspector);
    BitmapText.getset('bitmapFont',
        function () {
            return this._bitmapFont;
        },
        function (value) {
            if (this._bitmapFont !== value) {
                this._bitmapFont = value;
                Engine._renderContext.setBitmapFont(this);
            }
        },
        Fire.ObjectType(Fire.BitmapFont)
    );

    BitmapText.prop('_text', 'Text', Fire.HideInInspector);
    BitmapText.getset('text',
        function () {
            return this._text;
        },
        function (value) {
            if (this._text !== value) {
                if (typeof value === 'string') {
                    this._text = value;
                }
                else {
                    this._text = '' + value;
                }
                Engine._renderContext.setText(this, this._text);
            }
        },
        Fire.MultiText
    );

    BitmapText.prop('_anchor', BitmapText.TextAnchor.midCenter, Fire.HideInInspector);
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
        return Engine._renderContext.getTextSize(this);
    };

    var tempMatrix = new Fire.Matrix23();

    BitmapText.prototype.onPreRender = function () {
        this.getSelfMatrix(tempMatrix);
        tempMatrix.prepend(this.transform._worldTransform);
        PixiBitmapFontUtil.updateTransform(this, tempMatrix);
    };

    BitmapText.prototype.getSelfMatrix = function (out) {
        var textSize = Engine._renderContext.getTextSize(this);
        var w = textSize.x;
        var h = textSize.y;

        var anchorOffsetX = 0;
        var anchorOffsetY = 0;

        switch (this._anchor) {
            case BitmapText.TextAnchor.topLeft:
                break;
            case BitmapText.TextAnchor.topCenter:
                anchorOffsetX = w * -0.5;
                break;
            case BitmapText.TextAnchor.topRight:
                anchorOffsetX = -w;
                break;
            case BitmapText.TextAnchor.midLeft:
                anchorOffsetY = h * 0.5;
                break;
            case BitmapText.TextAnchor.midCenter:
                anchorOffsetX = w * -0.5;
                anchorOffsetY = h * 0.5;
                break;
            case BitmapText.TextAnchor.midRight:
                anchorOffsetX = -w;
                anchorOffsetY = h * 0.5;
                break;
            case BitmapText.TextAnchor.botLeft:
                anchorOffsetY = h;
                break;
            case BitmapText.TextAnchor.botCenter:
                anchorOffsetX = w * -0.5;
                anchorOffsetY = h;
                break;
            case BitmapText.TextAnchor.botRight:
                anchorOffsetX = -w;
                anchorOffsetY = h;
                break;
            default:
                break;
        }
        out.a = 1;
        out.b = 0;
        out.c = 0;
        out.d = 1;
        out.tx = anchorOffsetX;
        out.ty = anchorOffsetY;
    };

    return BitmapText;
})();

Fire.BitmapText = BitmapText;
