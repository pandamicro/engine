﻿
// 动画剪辑
var SpriteAnimationClip = (function () {

    // ------------------------------------------------------------------ 
    // Desc: 
    // ------------------------------------------------------------------ 

    var SpriteAnimationClip = Fire.define('Fire.SpriteAnimationClip', Fire.CustomAsset, function () {
        Fire.CustomAsset.call(this);
        this.frameInfos = [];                         ///< the list of frame info 
        this._frameInfoFrames = [];                   ///< the array of the end frame of each frame info
    });

    Fire.addCustomAssetMenu(SpriteAnimationClip, "New Sprite Animation");

    SpriteAnimationClip.WrapMode = (function (t) {
        t[t.Default = 0] = 'Default';
        t[t.Once = 1] = 'Once';
        t[t.Loop = 2] = 'Loop';
        t[t.PingPong = 3] = 'PingPong';
        t[t.ClampForever = 4] = 'ClampForever';
        return t;
    })({});

    SpriteAnimationClip.StopAction = (function (t) {
        t[t.DoNothing = 0] = 'DoNothing';         ///< do nothing
        t[t.DefaultSprite = 1] = 'DefaultSprite'; ///< set to default sprite when the sprite animation stopped
        t[t.Hide = 2] = 'Hide';                   ///< hide the sprite when the sprite animation stopped
        t[t.PingPong = 3] = 'PingPong';           ///< destroy the GameObject the sprite belongs to when the sprite animation stopped
        return t;
    })({});

    // ------------------------------------------------------------------ 
    /// The structure to descrip a frame in the sprite animation clip
    // ------------------------------------------------------------------ 

    SpriteAnimationClip.FrameInfo = function (_sprite, _frames) {
        this.sprite = _sprite;     ///< the texture info used in this frame
        this.frames = _frames;        ///< frame count
    };

    ///< the list of frame info  
    // to do 

    ///< default wrap mode
    SpriteAnimationClip.prop('wrapMode', SpriteAnimationClip.WrapMode.Default, Fire.Enum(SpriteAnimationClip.WrapMode));
    ///< the default type of action used when the animation stopped
    SpriteAnimationClip.prop('stopAction', SpriteAnimationClip.StopAction.DoNothing, Fire.Enum(SpriteAnimationClip.StopAction));
    ///< the default speed of the animation clip
    SpriteAnimationClip.prop('speed', 1);
    // the sample rate used in this animation clip
    SpriteAnimationClip.prop('_frameRate', 60, Fire.HideInInspector);   
    SpriteRenderer.getset('frameRate',
        function () {
            return this._frameRate;
        },
        function (value) {
            if (value !== this._frameRate) {
                this._frameRate = Math.round(Math.max(value, 1));
            }
        }
    );

    // ------------------------------------------------------------------ 
    // Desc: 
    // ------------------------------------------------------------------ 

    SpriteAnimationClip.prototype.getTotalFrames = function () {
        var frames = 0;
        for (var i = 0; i < this.frameInfos.length; ++i) {
            frames += this.frameInfos[i].frames;
        }
        return frames;
    };

    // ------------------------------------------------------------------ 
    // Desc: 
    // ------------------------------------------------------------------ 

    SpriteAnimationClip.prototype.getFrameInfoFrames = function () {
        if (this._frameInfoFrames === null) {
            this._frameInfoFrames = new Array(this.frameInfos.length);
            var totalFrames = 0;
            for (var i = 0; i < this.frameInfos.length; ++i) {
                totalFrames += this.frameInfos[i].frames;
                this._frameInfoFrames[i] = totalFrames;
            }
        }
        return this._frameInfoFrames;
    };

    return SpriteAnimationClip;

})();

Fire.SpriteAnimationClip = SpriteAnimationClip;