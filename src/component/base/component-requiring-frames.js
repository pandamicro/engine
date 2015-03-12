var _requiringFrames = [];  // the requiring frame infos

Fire._RFpush = function (module, uuid, script) {
    if (arguments.length === 2) {
        script = uuid;
        uuid = '';
    }
    _requiringFrames.push({
        uuid: uuid,
        script: script,
        module: module,
        exports: module.exports,    // original exports
        comp: null
    });
};

Fire._RFpop = function () {
    var frameInfo = _requiringFrames.pop();
    // check exports
    var module = frameInfo.module;
    var exports = frameInfo.exports;
    if (exports === module.exports) {
        for (var key in exports) {
            return;
        }
        // auto export component
        module.exports = frameInfo.comp;
    }
};

Fire._RFget = function () {
    return _requiringFrames[_requiringFrames.length - 1];
};
