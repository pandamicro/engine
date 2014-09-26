
module('Engine.loadScene', TestEnv);

var assetDir = '../assets';
var projPath = assetDir;
var libPath = projPath + '/library';
Fire.AssetLibrary.init(libPath);

asyncTest('load', function () {
    Engine.loadScene('74325665', function (scene) {
        clearTimeout(timerId);
        ok(scene, 'can load scene');

        var ent = Entity.find('/Entity');
        ok(scene, 'can load entity');
        ok(ent.transform, 'can load transform');

        var sr = ent.getComponent(Fire.SpriteRenderer);
        ok(sr, 'can load component');
        ok(sr.sprite.texture.image, 'can load asset');

        ok(sr._isOnEnableCalled, 'should trigger onEnable');
        ok(sr._isOnLoadCalled, 'should trigger onLoad');
        
        ok(Engine._renderContext.checkMatchCurrentScene(), 'check render context');

        start();
    });
    var timerId = setTimeout(function () {
        ok(false, 'time out!');
        start();
    }, 100);
});
