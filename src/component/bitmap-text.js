
var BitmapText = (function () {

    /**
     * @class BitmapText
     */
    /**
     * @namespace BitmapText
     */
    /**
     * @class TextAlign
     * @static
     */
    var TextAlign = Fire.defineEnum({
        /**
         * @property left
         * @type {number}
         */
        left: -1,
        /**
         * @property center
         * @type {number}
         */
        center: -1,
        /**
         * @property right
         * @type {number}
         */
        right: -1
    });

    /**
     * @class TextAnchor
     * @static
     */
    var TextAnchor = (function (t) {
        /**
         * @property topLeft
         * @type {number}
         */
        t[t.topLeft = 0] = 'Top Left';
        /**
         * @property topCenter
         * @type {number}
         */
        t[t.topCenter = 1] = 'Top Center';
        /**
         * @property topRight
         * @type {number}
         */
        t[t.topRight = 2] = 'Top Right';
        /**
         * @property midLeft
         * @type {number}
         */
        t[t.midLeft = 3] = 'Middle Left';
        /**
         * @property midCenter
         * @type {number}
         */
        t[t.midCenter = 4] = 'Middle Center';
        /**
         * @property midRight
         * @type {number}
         */
        t[t.midRight = 5] = 'Middle Right';
        /**
         * @property botLeft
         * @type {number}
         */
        t[t.botLeft = 6] = 'Bottom Left';
        /**
         * @property botCenter
         * @type {number}
         */
        t[t.botCenter = 7] = 'Bottom Center';
        /**
         * @property botRight
         * @type {number}
         */
        t[t.botRight = 8] = 'Bottom Right';
        return t;
    })({});


    /**
     * The bitmap font renderer component.
     * @class BitmapText
     * @extends Renderer
     * @constructor
     */
    var BitmapText = Fire.extend("Fire.BitmapText", Renderer, function () {
        RenderContext.initRenderer(this);
    });

    BitmapText.TextAlign = TextAlign;
    BitmapText.TextAnchor = TextAnchor;

    //-- 增加 Bitmap Text 到 组件菜单上
    Fire.addComponentMenu(BitmapText, 'BitmapText');
    Fire.executeInEditMode(BitmapText);

    BitmapText.prop('_bitmapFont', null, Fire.HideInInspector);
    /**
     * The font to render.
     * @property bitmapFont
     * @type {BitmapFont}
     * @default null
     */
    BitmapText.getset('bitmapFont',
        function () {
            return this._bitmapFont;
        },
        function (value) {
            this._bitmapFont = value;
            Engine._renderContext.updateBitmapFont(this);
        },
        Fire.ObjectType(Fire.BitmapFont)
    );

    BitmapText.prop('_text', 'Text', Fire.HideInInspector);

    /**
     * The text to render.
     * @property text
     * @type {string}
     * @default ""
     */
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

    /**
     * The anchor point of the text.
     * @property anchor
     * @type {BitmapText.TextAnchor}
     * @default BitmapText.TextAnchor.midCenter
     */
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

    /**
     * How lines of text are aligned (left, right, center).
     * @property align
     * @type {BitmapText.TextAlign}
     * @default BitmapText.TextAlign.left
     */
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
