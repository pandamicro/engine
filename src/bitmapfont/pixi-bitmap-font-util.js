
var PixiBitmapFontUtil = {};

var emptyFont = {
    face: "None",
    size: 1,
    align: "left",
};

function _getStyle(target) {
    var font = emptyFont;
    if (target.bitmapFont) {
        font = {
            face: target.bitmapFont.face,
            size: target.bitmapFont.size,
            align: BitmapText.TextAlign[target.align],
        };
    }
    var style = {
        font: font.size + " " + font.face,
        align: font.align,
    };
    return style;
}

function _setStyle(target) {
    var style = _getStyle(target);
    if (target._renderObj) {
        target._renderObj.setStyle(style);
    }
    if (target._renderObjInScene) {
        target._renderObjInScene.setStyle(style);
    }
}

function _getNewMatrix23(child, tempMatrix) {
    var mat = new Fire.Matrix23();
    mat.a = child.scale.x;
    mat.b = 0;
    mat.c = 0;
    mat.d = child.scale.y;
    mat.tx = child.position.x;
    mat.ty = -child.position.y;
    mat.prepend(tempMatrix);
    mat.b = -mat.b;
    mat.c = -mat.c;
    mat.ty = Fire.Engine._curRenderContext.renderer.height - mat.ty;
    return mat;
}

function _registerFont(bitmapFont) {
    var data = {};
    if (!bitmapFont) {
        data.font = 'None';
        data.size = 1;
        data.lineHeight = 1;
        data.chars = {};
    }
    else {
        data.font = bitmapFont.face;
        data.size = bitmapFont.size;
        data.lineHeight = bitmapFont.lineHeight;
        data.chars = {};
        var i = 0, charInfos = bitmapFont.charInfos, len = charInfos.length;
        for (; i < len; i++) {
            var charInfo = charInfos[i];
            var id = charInfo.id;
            var textureRect = new PIXI.Rectangle(
                charInfo.x,
                charInfo.y,
                charInfo.width,
                charInfo.height
            );

            var texture = null;
            if (bitmapFont && bitmapFont.texture) {
                var img = new PIXI.BaseTexture(bitmapFont.texture.image);
                texture = new PIXI.Texture(img, textureRect);
            }

            data.chars[id] = {
                xOffset: charInfo.xOffset,
                yOffset: charInfo.yOffset,
                xAdvance: charInfo.xAdvance,
                kerning: {},
                texture: PIXI.TextureCache[id] = texture
            };
        }
        var kernings = bitmapFont.kernings;
        for (i = 0; i < kernings.length; i++) {
            var kerning = kernings[i];
            var first = kerning.first;
            var second = kerning.second;
            var amount = kerning.amount;
            data.chars[second].kerning[first] = amount;
        }
    }
    PIXI.BitmapText.fonts[data.font] = data;
}

RenderContext.prototype.setText = function (target, newText) {
    if (target._renderObj) {
        target._renderObj.setText(newText);
    }
    if (this.sceneView) {
        target._renderObjInScene.setText(newText);
    }
};

RenderContext.prototype.setAlign = function (target) {
    _setStyle(target);
};

RenderContext.prototype.setBitmapFont = function (target) {
    _registerFont(target.bitmapFont);
    _setStyle(target);
};

RenderContext.prototype.addBitmapText = function (target) {
    _registerFont(target.bitmapFont);

    var style = _getStyle(target);

    target._renderObj = new PIXI.BitmapText(target.text, style);
    target.entity._pixiObj.addChildAt(target._renderObj, 0);

    if (this.sceneView) {
        target._renderObjInScene = new PIXI.BitmapText(target.text, style);
        target.entity._pixiObjInScene.addChildAt(target._renderObjInScene, 0);
    }
};

PixiBitmapFontUtil.updateTransform = function (target, tempMatrix) {
    Engine._curRenderContext.updateTransform(target, tempMatrix);
    var i = 0, childrens = null, len = 0, child = null;
    if (target._renderObj) {
        childrens = target._renderObj.children;
        for (len = childrens.length; i < len; i++) {
            child = childrens[i];
            child.worldTransform = _getNewMatrix23(child, tempMatrix);
        }
    }
   
    if (target._renderObjInScene) {
        childrens = target._renderObjInScene.children;
        for (i = 0, len = childrens.length; i < len; i++) {
            child = childrens[i];
            child.worldTransform = _getNewMatrix23(child, tempMatrix);
        }
    }
};
