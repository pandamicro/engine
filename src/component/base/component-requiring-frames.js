var _requiringFrames = [];  // the requiring frame infos

Fire._RFpush = function (uuid, script) {
    if (arguments.length === 1) {
        script = uuid;
        uuid = '';
    }
    _requiringFrames.push({
        uuid: uuid,
        script: script
    });
};

Fire._RFpop = function () {
    _requiringFrames.pop();
};

Fire._RFget = function () {
    return _requiringFrames[_requiringFrames.length - 1];
};
