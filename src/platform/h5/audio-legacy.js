(function(){
    var AudioContext = {};
    var WebAudio = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext);
    if (WebAudio) { return; }

    Fire.AudioClipLoader = (function () {
        return function (url, callback, onProgress) {
            var element = document.createElement("audio");
            element.src = realUrl;
            callback(element);
        };
    })();

    // 靜音
    AudioContext.mute = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.muted = target.mute;
    };

    // 设置音量，音量范围是[0, 1]
    AudioContext.volume = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.volume = target.volume;
    };

    // 设置循環
    AudioContext.loop = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.loop = target.loop;
    };

    // 将音乐源节点绑定具体的音频buffer
    AudioContext.setAudioClip = function (target) {
        if (!target || !target._audio) { return; }
        target._audio = target.audioClip.clip;
    };

    // 暫停
    AudioContext.pause = function (target) {
        if (!target._audio) { return; }
        target._audio.pause();
    };

    // 停止
    AudioContext.stop = function (target) {
        if (!target._audio) { return; }
        target._audio.pause();
        target._audio.currentTime = 0;
    };

    // 播放
    AudioContext.play = function (target) {
        if (!target || !target.audioClip || !target.audioClip.clip) { return; }
        target._audio = target.audioClip.clip;
        this.loop(target);
        target._audio.play();
    };

    Fire.AudioContext = AudioContext;
})();
