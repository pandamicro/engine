(function () {
    var UseWebAudio = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext);
    var webAudio = null;
    if (!UseWebAudio) {
        return;
    }
    var AudioContext = {};

    Fire.AudioClipLoader = function (url, callback, onProgress) {
        var cb = callback && function (xhr, error) {
            if (xhr) {
                if (!webAudio) {
                    webAudio = new UseWebAudio();
                }
                webAudio.decodeAudioData(xhr.response, function (buffer) {
                    callback(buffer);
                },function (e) {
                    callback(null, 'LoadAudioClip: "' + url +
                    '" seems to be unreachable or the file is empty. InnerMessage: ' + e);
                });
            }
            else {
                callback(null, 'LoadAudioClip: "' + url +
               '" seems to be unreachable or the file is empty. InnerMessage: ' + error);
            }
        };
        _LoadFromXHR(url, cb, onProgress, 'arraybuffer');
    };
    
    AudioContext.initSource = function (target) {
        target._startOffset = 0;
        target._startTime = 0;
        target._buffSource = null;
        target._volumeGain = null;
    };

    // 靜音
    AudioContext.updateMute = function (target) {
        if (!target._volumeGain) { return; }
        target._volumeGain.gain.value = target.mute ? -1 : this.updateVolume(target);
    };
    
    // 设置音量，音量范围是[0, 1]
    AudioContext.updateVolume = function (target) {
        if (!target || !target._volumeGain) { return; }
        target._volumeGain.gain.value = (target.volume - 1);
    };
    
    // 设置循环
    AudioContext.updateLoop = function (target) {
        if (!target || !target._buffSource ) { return; }
        target._buffSource.loop = target.loop;
    };
    
    // 将音乐源节点绑定具体的音频buffer
    AudioContext.updateAudioClip = function (target) {
        if (!target || !target._buffSource) { return; }
        target._buffSource.buffer = target.audioClip.clip;
    };

    // 暂停
    AudioContext.pause = function (target) {
        this.stop();
    };

    // 停止
    AudioContext.stop = function (target) {
        if (!target._buffSource) { return; }
        target._buffSource.stop();
        if (target._pause) {
            target._startOffset += webAudio.currentTime - target._startTime;
        }
        else {
            target._startOffset = 0;
            target._buffSource = null;
            target._volumeGain = null;
        }
    };

    // 播放
    AudioContext.play = function (target) {
        if (!target.audioClip || !target.audioClip.clip) { return; }
        if (target._play) { return; }
        // 初始化
        if (!target._buffSource) {
            // 创建音频源节点
            var bufsrc = webAudio.createBufferSource();
            // 控制音量的节点
            var gain = webAudio.createGain();
            // source节点先连接到对音量控制的volume增益节点上
            bufsrc.connect(gain);
            // volume增益节点再连接到最终的输出设备上
            gain.connect(webAudio.destination);
            // 将音频源与硬件连接
            bufsrc.connect(webAudio.destination);

            target._buffSource = bufsrc;
            target._volumeGain = gain;
        }
        // 設置開始播放時間
        target._startTime = webAudio.currentTime;
        // 将音乐源节点绑定具体的音频buffer
        this.updateAudioClip(target);
        // 设置音量，音量范围是[0, 1]
        this.updateVolume(target);
        // 是否禁音
        this.updateMute(target);
        // 是否循環播放
        this.updateLoop(target);
        // 播放音樂
        if (target._pause) {
            target._buffSource.start(0, target._startOffset % buffer.duration);
        }
        else {
            target._buffSource.start(0);
        }
    };

    Fire.AudioContext = AudioContext;
})();
