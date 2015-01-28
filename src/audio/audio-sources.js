
var AudioSources = (function () {
    var AudioSources = Fire.define("Fire.AudioSources", Component, function () {
        this._startOffset = 0;
        this._startTime = 0;
        this._curAudioSource = null;
        this._curVolume = null;
        this._play = false;
        this._pause = false;
        this._audio = null;
    });

    //-- 增加 Audio Sources 到 组件菜单上
    Fire.addComponentMenu(AudioSources, 'AudioSources');

    AudioSources.prop('_audioClip', null, Fire.HideInInspector);
    AudioSources.getset('audioClip',
        function () {
            return this._audioClip;
        },
        function (value) {
            if (this._audioClip !== value) {
                this._audioClip = value;
                Fire.AudioContext.setAudioClip(this);
            }
        },
        Fire.ObjectType(Fire.AudioClip)
    );

    AudioSources.prop('_loop', false, Fire.HideInInspector);
    AudioSources.getset('loop',
       function () {
           return this._loop;
       },
       function (value) {
           if (this._loop !== value) {
               this._loop = value;
               Fire.AudioContext.loop(this);
           }
       }
    );

    AudioSources.prop('_mute', false, Fire.HideInInspector);
    AudioSources.getset('mute',
       function () {
           return this._mute;
       },
       function (value) {
           if (this._mute !== value) {
               this._mute = value;
               Fire.AudioContext.mute(this);
           }
       }
    );

    AudioSources.prop('_volume', 1, Fire.HideInInspector);
    AudioSources.getset('volume',
       function () {
           return this._volume;
       },
       function (value) {
           if (this._volume !== value) {
               if (value > 1) { value = 1; }
               if (value < 0) { value = 0; }
               this._volume = value;
               Fire.AudioContext.volume(this);
           }
       },
       Fire.Double
    );

    AudioSources.prop('_playOnAwake', true, Fire.HideInInspector);
    AudioSources.getset('playOnAwake',
       function () {
           return this._playOnAwake;
       },
       function (value) {
           if (this._playOnAwake !== value) {
               this._playOnAwake = value;
           }
       }
    );

    AudioSources.prototype.pauseAudio = function () {
        Fire.AudioContext.pause(this);
    };

    AudioSources.prototype.playAudio = function () {
        Fire.AudioContext.play(this);
    };

    AudioSources.prototype.stopAudio = function () {
        Fire.AudioContext.stop(this);
    };

    AudioSources.prototype.onLoad = function () {
        if (!Fire.Engine.isPlaying) {
            this.stopAudio();
        }
    };

    AudioSources.prototype.onStart = function () {
        if (this.playOnAwake) {
            this.playAudio();
        }
    };

    AudioSources.prototype.onEnable = function () {
        if (this.playOnAwake && Fire.Engine.isPlaying) {
            this.playAudio();
        }
    };

    AudioSources.prototype.onDisable = function () {
        this.stopAudio();
    };

    return AudioSources;
})();

Fire.AudioSources = AudioSources;
