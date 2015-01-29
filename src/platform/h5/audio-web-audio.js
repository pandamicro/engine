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
                },
                function (e) {
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
    
    AudioContext.initAudioContext = function (audioSource) {
        audioSource._startOffset = 0;
        audioSource._startTime = 0;
        audioSource._curAudioSource = null;
        audioSource._curVolume = null;
        audioSource._play = null;
        audioSource._pause = null;
    };

    // 靜音
    AudioContext.updateMute = function (target) {
        if (!target._curVolume) { return; }
        target._curVolume.gain.value = target.mute ? -1 : this.updateVolume(target);
    };
    
    // 设置音量，音量范围是[0, 1]
    AudioContext.updateVolume = function (target) {
        if (!target || !target._curVolume) { return; }
        target._curVolume.gain.value = (target.volume - 1);
    };
    
    // 设置循环
    AudioContext.updateLoop = function (target) {
        if (!target || !target._curAudioSource ) { return; }
        target._curAudioSource.loop = target.loop;
    };
    
    // 将音乐源节点绑定具体的音频buffer
    AudioContext.updateAudioClip = function (target) {
        if (!target || !target._curAudioSource) { return; }
        target._curAudioSource.buffer = target.audioClip.clip;
    };

    // 暂停
    AudioContext.pause = function (target) {
        target._pause = true;
        this.stop();
    };

    // 停止
    AudioContext.stop = function (target) {
        if (!target._curAudioSource) { return; }
        target._curAudioSource.stop();
        if (target._pause) {
            target._startOffset += webAudio.currentTime - target._startTime;
        }
        else {
            target._startOffset = 0;
            target._curAudioSource = null;
            target._volume = null;
        }
        target._play = false;
    };

    // 播放
    AudioContext.play = function (target) {
        if (!target.audioClip || !target.audioClip.clip) { return; }
        if (target._play) { return; }
        // 初始化
        this.createAudioSource(target);
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
            target._curAudioSource.start(0, target._startOffset % buffer.duration);
            target._pause = false;
        }
        else {
            target._curAudioSource.start(0);
        }
        target._play = true;
    };
    
    // 穿件初始化
    AudioContext.createAudioSource = function (target) {
        // 创建音频源节点
        var audioSource = webAudio.createBufferSource();
        // 控制音量的节点
        var volume = webAudio.createGain();
        // source节点先连接到对音量控制的volume增益节点上
        audioSource.connect(volume);
        // volume增益节点再连接到最终的输出设备上
        volume.connect(webAudio.destination);
        // 将音频源与硬件连接
        audioSource.connect(webAudio.destination);

        target._curAudioSource = audioSource;
        target._curVolume = volume;
    };
    
    Fire.AudioContext = AudioContext;
})();
