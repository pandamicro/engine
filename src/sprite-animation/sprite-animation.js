
var SpriteAnimation = (function () {

    // 定义一个名叫Sprite Animation 组件
    var SpriteAnimation = Fire.define('Fire.SpriteAnimation', Component, function () {
        Component.call(this);
        
        this.animations = [];
        this._nameToState = {};
        this._curAnimation = null;
        this._spriteRenderer = null;
        this._defaultSprite = null;
        this._lastFrameIndex = -1;
        this._curIndex = -1;
        this._playStartFrame = 0;// 在调用Play的当帧的LateUpdate不进行step
    });

    //-- 增加 Sprite Animation 到 组件菜单上
    Fire.addComponentMenu(SpriteAnimation, 'SpriteAnimation');
    ////-- 定义 Sprite Animation 属性
    //SpriteAnimation.prop('Animations', []);
    
    SpriteAnimation.prop('defaultAnimation', null , Fire.ObjectType(Fire.SpriteAnimationClip));

    SpriteAnimation.prop('sprite1', null, Fire.ObjectType(Fire.Sprite));
    SpriteAnimation.prop('frames1', 4);
                                          
    SpriteAnimation.prop('sprite2', null, Fire.ObjectType(Fire.Sprite));
    SpriteAnimation.prop('frames2', 4);
                                          
    SpriteAnimation.prop('sprite3', null, Fire.ObjectType(Fire.Sprite));
    SpriteAnimation.prop('frames3', 4);

    SpriteAnimation.prop('sprite4', null, Fire.ObjectType(Fire.Sprite));
    SpriteAnimation.prop('frames4', 4);

    SpriteAnimation.prop('sprite5', null, Fire.ObjectType(Fire.Sprite));
    SpriteAnimation.prop('frames5', 4);

    SpriteAnimation.prop('sprite6', null, Fire.ObjectType(Fire.Sprite));
    SpriteAnimation.prop('frames6', 4);

    SpriteAnimation.prop('playAutomatically_', false, Fire.HideInInspector);
    SpriteAnimation.getset('playAutomatically',
        function () {
            return this.playAutomatically_;
        },
        function (value) {
            this.playAutomatically_ = value;
            var animState = this.getAnimState();
            if (value === true) {
                this.play(animState, 0);
            }
            else {
                this.stop(animState);
            }
        }
    );

    SpriteAnimation.prototype.getAnimState = function () {
        var animClip = this.defaultAnimation;
        animClip.frameInfos = [];
        var frameInfo = new Fire.SpriteAnimationClip.FrameInfo(this.sprite1, this.frames1);
        animClip.frameInfos.push(frameInfo);
        frameInfo = new Fire.SpriteAnimationClip.FrameInfo(this.sprite2, this.frames2);
        animClip.frameInfos.push(frameInfo);
        frameInfo = new Fire.SpriteAnimationClip.FrameInfo(this.sprite3, this.frames3);
        animClip.frameInfos.push(frameInfo);
        frameInfo = new Fire.SpriteAnimationClip.FrameInfo(this.sprite4, this.frames4);
        animClip.frameInfos.push(frameInfo);
        frameInfo = new Fire.SpriteAnimationClip.FrameInfo(this.sprite5, this.frames5);
        animClip.frameInfos.push(frameInfo);
        frameInfo = new Fire.SpriteAnimationClip.FrameInfo(this.sprite6, this.frames6);
        animClip.frameInfos.push(frameInfo);

        this._spriteRenderer = this.entity.getComponent(Fire.SpriteRenderer);

        var newAnimState = new Fire.SpriteAnimationState(animClip.name, animClip);

        return newAnimState;
    };

    SpriteAnimation.prototype.init = function () {
        var initialized = (this.nameToState !== null);
        if (initialized === false) {
            this.sprite_ = this.entity.getComponent(Fire.Sprite);
            this._defaultSprite = sprite_;

            this.nameToState = {};
            for (var i = 0; i < this.animations.length; ++i) {
                var clip = this.animations[i];
                if (clip !== null) {
                    var state = new Fire.SpriteAnimationState(clip);
                    this.nameToState[state.name] = state;
                    if (this.defaultAnimation === clip) {
                        this.curAnimation = state;
                        this.lastFrameIndex = -1;
                    }
                }
            }
        }
    };

    SpriteAnimation.prototype.play = function (animState, time) {
        this._curAnimation = animState;
        if (this._curAnimation !== null) {
            this._curIndex = -1;
            this._curAnimation.time = time;
            this._playStartFrame = Fire.Time.frameCount;
            this.sample();
        }
    };

    SpriteAnimation.prototype.lateUpdate = function () {
        if (this._curAnimation !== null && Fire.Time.frameCount > this._playStartFrame) {
            var delta = Math.floor(Fire.Time.deltaTime * this._curAnimation.speed);
            this.step(delta);
        }
    };

    SpriteAnimation.prototype.step = function (deltaTime) {
        if (this._curAnimation !== null) {
            this._curAnimation.time += deltaTime;
            this.sample();
            var stop = false;
            if (this._curAnimation.wrapMode === Fire.SpriteAnimationClip.WrapMode.Once ||
                this._curAnimation.wrapMode === Fire.SpriteAnimationClip.WrapMode.Default ||
                this._curAnimation.wrapMode === Fire.SpriteAnimationClip.WrapMode.ClampForever) {
                if (this._curAnimation.speed > 0 && this._curAnimation.frame >= this._curAnimation.totalFrames) {
                    if (this._curAnimation.wrapMode === Fire.SpriteAnimationClip.WrapMode.ClampForever) {
                        stop = false;
                        this._curAnimation.frame = this._curAnimation.totalFrames;
                        this._curAnimation.time = Math.floor(this._curAnimation.frame / this._curAnimation.clip.frameRate);
                    }
                    else {
                        stop = true;
                        this._curAnimation.frame = this._curAnimation.totalFrames;
                    }
                }
                else if (this._curAnimation.speed < 0 && this._curAnimation.frame < 0) {
                    if (this._curAnimation.wrapMode === Fire.SpriteAnimationClip.WrapMode.ClampForever) {
                        stop = false;
                        this._curAnimation.time = 0;
                        this._curAnimation.frame = 0;
                    }
                    else {
                        stop = true;
                        this._curAnimation.frame = 0;
                    }
                }
            }

            // do stop
            if (stop) {
                this.stop(this._curAnimation);
            }
        }
        else {
            this._curIndex = -1;
        }
    };

    SpriteAnimation.prototype.sample = function () {
        if (this._curAnimation !== null) {
            var newIndex = this._curAnimation.getCurrentIndex();
            if (newIndex >= 0 && newIndex != this._curIndex) {
                this._spriteRenderer.sprite = this._curAnimation.clip.frameInfos[newIndex].sprite;
            }
            this._curIndex = newIndex;
        }
        else {
            this._curIndex = -1;
        }
    };

    SpriteAnimation.prototype.stop = function (animState) {
        if ( animState !== null ) {
            if (animState === this._curAnimation) {
                this._curAnimation = null;
            }
            animState.time = 0;

            var stopAction = animState.stopAction;
            switch (stopAction) {
                case Fire.SpriteAnimationClip.StopAction.DoNothing:
                    break;
                case Fire.SpriteAnimationClip.StopAction.DefaultSprite:
                    this._spriteRenderer.sprite = this._defaultSprite;
                    break;
                case Fire.SpriteAnimationClip.StopAction.Hide:
                    this._spriteRenderer.enabled = false;
                    break;
                case Fire.SpriteAnimationClip.StopAction.Destroy:

                    break;
                default:
                    break;
            }
            this._curAnimation = null;
        }
    };

    return SpriteAnimation;
})();

Fire.SpriteAnimation = SpriteAnimation;
