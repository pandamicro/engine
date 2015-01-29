(function(){
    var UseWebAudio = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext);
    if (UseWebAudio) { return; }
    var AudioContext = {};

    Fire.AudioClipLoader = function (url, callback, onProgress) {
        var audio = document.createElement("audio");
        audio.addEventListener("canplaythrough", function () {
            callback(audio);
        }, false);
        audio.addEventListener('error', function (e) {
            callback(null, 'LoadAudioClip: "' + url +
                    '" seems to be unreachable or the file is empty. InnerMessage: ' + this.error);
        }, false);

        audio.src = url;
        audio.load();
    };

    AudioContext.initSource = function (target) {
        target._audio = null;
    };

    // 靜音
    AudioContext.updateMute = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.muted = target.mute;
    };

    // 设置音量，音量范围是[0, 1]
    AudioContext.updateVolume = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.volume = target.volume;
    };

    // 设置循環
    AudioContext.updateLoop = function (target) {
        if (!target || !target._audio) { return; }
        target._audio.loop = target.loop;
    };

    // 将音乐源节点绑定具体的音频buffer
    AudioContext.updateAudioClip = function (target) {
        if (!target || !target.audioClip) { return; }
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
        if (target._play) { return; }
        this.updateAudioClip(target);
        this.updateVolume(target);
        this.updateLoop(target);
        this.updateMute(target);
        target._audio.play();
    };

    Fire.AudioContext = AudioContext;
})();
