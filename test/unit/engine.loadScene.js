
module('Engine.loadScene', {
    setup: function () {
        if (!Engine.inited) {
            Engine.init();
        }
        TestOnly.update = null;
        //console.log('setup');
        Engine.stop();
    },
    teardown: function () {
        //console.log('teardown');
        Engine.stop();
    }
});

var assetDir = '../assets';
var projPath = assetDir;
var libPath = projPath + '/library';
FIRE.AssetLibrary.init(libPath);

asyncTest('load', function () {
    Engine.loadScene('74325665', function (scene) {
        clearTimeout(timerId);
        ok(scene, 'can load scene');

        var ent = Entity.find('/Entity');
        ok(scene, 'can load entity');
        ok(ent.transform, 'can load transform');

        var sr = ent.getComponent(FIRE.SpriteRenderer);
        ok(sr, 'can load component');
        ok(sr.sprite.texture.image, 'can load asset');

        start();
    });
    var timerId = setTimeout(function () {
        ok(false, 'time out!');
        start();
    }, 100);
});
