
var assetDir = '../assets';
var projPath = assetDir;
var libPath = projPath + '/library';

largeModule('AssetLibrary');
AssetLibrary = FIRE.AssetLibrary;

asyncTest('test', function () {
    //var texture = new FIRE.Texture();
    //texture.height = 123;
    //texture.width = 321;
    //console.log(FIRE.serialize(texture));
    
    var grossini_uuid = '748321';
    var testLib = {
        grossini_uuid: assetDir + '/grossini.png'
    };
    AssetLibrary.init(libPath, testLib);

    var loaded = false;

    AssetLibrary.loadAssetByUuid(grossini_uuid, function (asset) {
        loaded = true;
        ok(asset, 'can load asset by uuid');
        strictEqual(asset.width, 321, 'can get width');
        strictEqual(asset.height, 123, 'can get height');
        start();
    });
    setTimeout(function () {
        if (!loaded) {
            ok(false, 'time out!');
            start();
        }
    }, 100);
});
