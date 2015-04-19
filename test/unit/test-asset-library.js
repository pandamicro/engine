
var assetDir = '../assets';
var projPath = assetDir;
var libPath = projPath + '/library';

var grossini_uuid = '748321';
var grossiniSprite_uuid = '1232218';

largeModule('AssetLibrary', {
    setup: function () {
        Engine._reset();
        AssetLibrary.init(libPath);
    }
});

asyncTest('load asset with raw', function () {
    //var texture = new Fire.Texture();
    //texture.height = 123;
    //texture.width = 321;
    //Fire.log(Editor.serialize(texture));

    AssetLibrary.loadAsset(grossini_uuid, function (err, asset) {
        clearTimeout(timerId);
        ok(asset, 'can load asset by uuid');
        strictEqual(asset.width, 321, 'can get width');
        strictEqual(asset.height, 123, 'can get height');
        ok(asset.image, 'can get image');
        start();
    });
    var timerId = setTimeout(function () {
        ok(false, 'time out!');
        start();
    }, 100);
});

asyncTest('load asset with depends asset', function () {
    //var sprite = new Fire.Sprite();
    //sprite.texture = new Fire.Texture();
    //sprite.texture._uuid = grossini_uuid;
    //Fire.log(Editor.serialize(sprite));

    AssetLibrary.loadAsset(grossiniSprite_uuid, function (err, asset) {
        clearTimeout(timerId);
        ok(asset.texture, 'can load depends asset');
        strictEqual(asset.texture.height, 123, 'can get height');
        ok(asset.texture.image, 'can load depends asset\'s host');
        start();
    });
    var timerId = setTimeout(function () {
        ok(false, 'time out!');
        start();
    }, 100);
});
