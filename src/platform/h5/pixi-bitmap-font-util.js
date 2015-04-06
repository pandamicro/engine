PIXI.BitmapText.prototype.updateTransform = function () {
};

Fire.BitmapFont.prototype._onPreDestroy = function () {
    if (this._uuid) {
        PIXI.BitmapText.fonts[this._uuid] = null;
    }
};

var PixiBitmapFontUtil = {};

var defaultFace = "None";

function _getStyle (target) {
    if (target.bitmapFont && target.bitmapFont._uuid) {
        return {
            font : target.bitmapFont.size + " " + target.bitmapFont._uuid,
            align: BitmapText.TextAlign[target.align].toLowerCase(),
        };
    }
    else {
        return {
            font : 1 + " " + defaultFace,
            align: "left",
        };
    }
}

function _setStyle (target) {
    var style = _getStyle(target);
    if (target._renderObj) {
        target._renderObj.setStyle(style);
    }
    if (target._renderObjInScene) {
        target._renderObjInScene.setStyle(style);
    }
}

function _getNewMatrix23 (child, tempMatrix) {
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
var tempData = {
    face      : defaultFace,
    size      : 1,
    chars     : {},
    lineHeight: 1
};

function _registerFont (bitmapFont) {

    //var registered = _hasPixiBitmapFont(bitmapFont);
    //if (registered) {
    //    return;
    //}

    var data = {};
    if (bitmapFont && bitmapFont._uuid) {
        data.face = bitmapFont._uuid;
        data.size = bitmapFont.size;
        data.lineHeight = bitmapFont.lineHeight;
        data.chars = {};

        if (bitmapFont.texture) {
            var img = new PIXI.BaseTexture(bitmapFont.texture.image);

            var charInfos = bitmapFont.charInfos, len = charInfos.length;
            for (var i = 0; i < len; i++) {
                var charInfo = charInfos[i];
                var id = charInfo.id;
                var textureRect = new PIXI.Rectangle(
                    charInfo.x,
                    charInfo.y,
                    charInfo.width,
                    charInfo.height
                );

                if ((textureRect.x + textureRect.width) > img.width || (textureRect.y + textureRect.height) > img.height) {
                    Fire.error('Character in %s does not fit inside the dimensions of texture %s', bitmapFont.name, bitmapFont.texture.name);
                    break;
                }

                var texture = new PIXI.Texture(img, textureRect);

                data.chars[id] = {
                    xOffset : charInfo.xOffset,
                    yOffset : charInfo.yOffset,
                    xAdvance: charInfo.xAdvance,
                    kerning : {},
                    texture : texture
                };
            }
        }
        else {
            Fire.error('Invalid texture of bitmapFont: %s', bitmapFont.name);
        }

        var kernings = bitmapFont.kernings;
        for (var j = 0; j < kernings.length; j++) {
            var kerning = kernings[j];
            var first = kerning.first;
            var second = kerning.second;
            var amount = kerning.amount;
            data.chars[second].kerning[first] = amount;
        }
    }
    else {
        data = tempData;
    }
    PIXI.BitmapText.fonts[data.face] = data;
}

var _hasPixiBitmapFont = function (bitmapFont) {
    if (bitmapFont) {
        return PIXI.BitmapText.fonts[bitmapFont._uuid];
    }
    return null;
};

RenderContext.prototype.getTextSize = function (target) {
    var inGame = !(target.entity._objFlags & HideInGame);
    var w = 0, h = 0;
    if (inGame && target._renderObj) {
        if (target._renderObj.dirty) {
            target._renderObj.updateText();
            target._renderObj.dirty = false;
        }

        w = target._renderObj.textWidth;
        h = target._renderObj.textHeight;
    }
    else if (target._renderObjInScene) {
        if (target._renderObjInScene.dirty) {
            target._renderObjInScene.updateText();
            target._renderObjInScene.dirty = false;
        }

        w = target._renderObjInScene.textWidth;
        h = target._renderObjInScene.textHeight;
    }
    return new Vec2(w, h);
};

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

RenderContext.prototype.updateBitmapFont = function (target) {
    _registerFont(target.bitmapFont);
    _setStyle(target);
};

RenderContext.prototype.addBitmapText = function (target) {
    _registerFont(target.bitmapFont);

    var style = _getStyle(target);

    var inGame = !(target.entity._objFlags & HideInGame);
    if (inGame) {
        target._renderObj = new PIXI.BitmapText(target.text, style);
        target.entity._pixiObj.addChildAt(target._renderObj, 0);
    }
    if (this.sceneView) {
        target._renderObjInScene = new PIXI.BitmapText(target.text, style);
        target.entity._pixiObjInScene.addChildAt(target._renderObjInScene, 0);
    }
};

PixiBitmapFontUtil.updateTransform = function (target, tempMatrix) {
    var i = 0, childrens = null, len = 0, child = null;
    var isGameView = Engine._curRenderContext === Engine._renderContext;
    if (isGameView && target._renderObj) {
        if (target._renderObj.dirty) {
            target._renderObj.updateText();
            target._renderObj.dirty = false;
        }
        childrens = target._renderObj.children;
        for (len = childrens.length; i < len; i++) {
            child = childrens[i];
            child.worldTransform = _getNewMatrix23(child, tempMatrix);
        }
    }
    else if (target._renderObjInScene) {
        if (target._renderObjInScene.dirty) {
            target._renderObjInScene.updateText();
            target._renderObjInScene.dirty = false;
        }
        childrens = target._renderObjInScene.children;
        for (i = 0, len = childrens.length; i < len; i++) {
            child = childrens[i];
            child.worldTransform = _getNewMatrix23(child, tempMatrix);
        }
    }
};
