﻿(function () {
    if (!Fire.isAtomShell) {
        return;
    }

    var Ipc = require('ipc');

    Ipc.on('engine:renameEntity', function (id, name) {
        var entity = Entity._getInstanceById(id);
        if (entity && entity.isValid) {
            entity.name = name;
        }
    });

    Ipc.on('engine:deleteEntities', function (idList) {
        for (var i = 0; i < idList.length; i++) {
            var id = idList[i];
            var entity = Entity._getInstanceById(id);
            if (entity && entity.isValid) {
                entity.destroy();
            }
        }
        if ( !Engine.isPlaying ) {
            FObject._deferredDestroy();
        }
    });

})();
