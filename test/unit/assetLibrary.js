
var assetDir = '../assets';
var projPath = assetDir;
var libPath = projPath + '/library';

var grossini_uuid = '748321';
var grossiniSprite_uuid = '1232218';

largeModule('AssetLibrary');
AssetLibrary = FIRE.AssetLibrary;

asyncTest('load asset with host', function () {
    //var texture = new FIRE.Texture();
    //texture.height = 123;
    //texture.width = 321;
    //console.log(FIRE.serialize(texture));
    
    AssetLibrary.init(libPath);

    AssetLibrary.loadAssetByUuid(grossini_uuid, function (asset) {
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
    //var sprite = new FIRE.Sprite();
    //sprite.texture = new FIRE.Texture();
    //sprite.texture._uuid = grossini_uuid;
    //console.log(FIRE.serialize(sprite));
    
    AssetLibrary.init(libPath);

    AssetLibrary.loadAssetByUuid(grossiniSprite_uuid, function (asset) {
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
