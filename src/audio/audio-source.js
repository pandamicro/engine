
var AudioSources = (function () {
    var AudioSources = Fire.define("Fire.AudioSources", Component, function () {
        Fire.AudioContext.initAudioContext(this);
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
                Fire.AudioContext.updateAudioClip(this);
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
               Fire.AudioContext.updateLoop(this);
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
               Fire.AudioContext.updateMute(this);
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
               this._volume = Math.clamp(value);
               Fire.AudioContext.updateVolume(this);
           }
       },
       Fire.Range(0,1)
    );

    AudioSources.prop('playOnAwake', true, Fire.HideInInspector);

    AudioSources.prototype.pause = function () {
        Fire.AudioContext.pause(this);
    };

    AudioSources.prototype.play = function () {
        Fire.AudioContext.play(this);
    };

    AudioSources.prototype.stop = function () {
        Fire.AudioContext.stop(this);
    };

    AudioSources.prototype.onLoad = function () {
        if (!Fire.Engine.isPlaying) {
            this.stop();
        }
    };

    AudioSources.prototype.onStart = function () {
        if (this.playOnAwake) {
            this.play();
        }
    };

    AudioSources.prototype.onEnable = function () {
        if (this.playOnAwake && Fire.Engine.isPlaying) {
            this.play();
        }
    };

    AudioSources.prototype.onDisable = function () {
        this.stop();
    };

    return AudioSources;
})();

Fire.AudioSources = AudioSources;
