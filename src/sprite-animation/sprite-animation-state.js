
var SpriteAnimationState = (function () {

    var SpriteAnimationState = Fire.define('Fire.SpriteAnimationState', function (_name, _animClip) {
        this.clip = null;       ///< the referenced sprite sprite animation clip
        this.name = "";         ///< the name of the sprite animation state
        this.stopAction = Fire.SpriteAnimationClip.StopAction.DoNothing;        ///< the stop action
        this.length = 0;        ///< the length of the sprite animation in seconds with speed = 1.0f
        this.totalFrames = 0;   ///< the total frame count of the sprite animation clip
        this.speed = 1;         ///< the speed to play the sprite animation clip
        this.time = 0;          ///< the current time in seoncds
        /// The current index of frame. The value can be larger than totalFrames.
        /// If the frame is larger than totalFrames it will be wrapped according to wrapMode. 
        this.frame = -1;
        this._frameInfoFrames = {};  ///< the array of the end frame of each frame info in the sprite animation clip
        this._cachedIndex = -1; ///< cache result of GetCurrentIndex

        // 赋值
        this.clip = _animClip;
        this.name = _name;
        this.wrapMode = this.clip.wrapMode;
        this.stopAction = this.clip.stopAction;
        this.speed = this.clip.speed;
        this._frameInfoFrames = this.clip.getFrameInfoFrames();
        if (this._frameInfoFrames.length > 0) {
            this.totalFrames = this._frameInfoFrames[this._frameInfoFrames.length - 1];
        }
        else {
            this.totalFrames = 0;
        }
        this.length = this.totalFrames / this.clip.frameRate;
    });

    // ------------------------------------------------------------------ 
    /// \return Get current frame info index.
    // ------------------------------------------------------------------ 

    SpriteAnimationState.prototype.getCurrentIndex = function () {
        if (this.totalFrames > 1) {
            //int oldFrame = frame;
            this.frame = parseInt(this.time * this.clip.frameRate);
            if (this.frame < 0) {
                this.frame = -this.frame;
            }

            var wrappedIndex;
            if (this.wrapMode != Fire.SpriteAnimationClip.WrapMode.PingPong) {
                wrappedIndex = _wrap(this.frame, this.totalFrames - 1, this.wrapMode);
            }
            else {
                wrappedIndex = this.frame;
                var cnt = parseInt(wrappedIndex / this.totalFrames);
                wrappedIndex %= this.totalFrames;
                if ((cnt & 0x1) == 1) {
                    wrappedIndex = this.totalFrames - 1 - wrappedIndex;
                }
            }

            // try to use cached frame info index
            if (this._cachedIndex - 1 >= 0 &&
               wrappedIndex >= this._frameInfoFrames[this._cachedIndex - 1] &&
               wrappedIndex < this._frameInfoFrames[this._cachedIndex]) {
                return this._cachedIndex;
            }
            // search frame info
            var frameInfoIndex = _binarySearch(this._frameInfoFrames, wrappedIndex + 1);
            if (frameInfoIndex < 0) {
                frameInfoIndex = ~frameInfoIndex;
            }
            this._cachedIndex = frameInfoIndex;
            return frameInfoIndex;
        }
        else if (this.totalFrames == 1) {
            return 0;
        }
        else {
            return -1;
        }
    };

    // ------------------------------------------------------------------ 
    /// C# Array.BinarySearch
    // ------------------------------------------------------------------ 
    var _binarySearch = function (array, value) {
        var l = 0, h = array.length - 1;
        while (l <= h) {
            var m = ((l + h) >> 1);
            if (array[m] === value) {
                return m;
            }
            if (array[m] > value) {
                h = m - 1;
            }
            else {
                l = m + 1;
            }
        }
        return ~l;
    };

    var _wrap = function (_value, _maxValue, _wrapMode) {
        if (_maxValue === 0) {
            return 0;
        }
        if (_value < 0) {
            _value = -_value;
        }
        if (_wrapMode === Fire.SpriteAnimationClip.WrapMode.Loop) {
            return _value % (_maxValue + 1);
        }
        else if (_wrapMode === Fire.SpriteAnimationClip.WrapMode.PingPong) {
            var cnt = parseInt(_value / _maxValue);
            _value %= _maxValue;
            if ((cnt & 0x1) === 1) {
                return _maxValue - _value;
            }
        }
        else {
            if (_value < 0) {
                return 0;
            }
            if (_value > _maxValue) {
                return _maxValue;
            }
        }
        return _value;
    };

    return SpriteAnimationState;

})();

Fire.SpriteAnimationState = SpriteAnimationState;