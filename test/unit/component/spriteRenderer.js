module('SpriteRenderer', TestEnv);

var epsilon = 0.0001;

test('getLocalBounds', function () {
    var ent = new Entity();
    var renderer = ent.addComponent(SpriteRenderer);
    var sprite = new Fire.Sprite();
    sprite.x = 20;
    sprite.y = 60;
    sprite.width = 40;
    sprite.height = 10;
    renderer.sprite = sprite;
    
    deepEqual(renderer.getLocalBounds(), new Rect(0, -10, 40, 10), 'identity transform');

    ent.transform.rotation = -90;
    var actual = renderer.getLocalBounds();
    var expect = new Rect(-10, -40, 10, 40);
    deepClose(actual, expect, epsilon, 'rotated transform');

    ent.transform.rotation = 0;
    ent.transform.scale = new V2(1, 2);
    deepEqual(renderer.getLocalBounds(), new Rect(0, -20, 40, 20), 'scaled transform');

    ent.transform.rotation = -90;
    deepClose(renderer.getLocalBounds(), new Rect(-20, -40, 20, 40), epsilon, 'rotated scaled transform');

    ent.transform.position = new V2(12, 31);
    deepClose(renderer.getLocalBounds(), new Rect(-8/*-20 + 12*/, -9/*-40 + 31*/, 20, 40), epsilon, 'translated rotated scaled transform');
});

test('getWorldBounds', function () {
    var ent = new Entity();
    var renderer = ent.addComponent(SpriteRenderer);
    var sprite = new Fire.Sprite();
    sprite.width = 40;
    sprite.height = 10;
    renderer.sprite = sprite;

    ent.transform.rotation = -90;
    ent.transform.position = new V2(12, 31);
    ent.transform.scale = new V2(1, 2);
    // local bounds: (-8, -9, 20, 40)

    var parentEnt = new Entity();
    ent.transform.parent = parentEnt.transform;
    parentEnt.transform.position = new V2(-100, -30);
    parentEnt.transform.scale = new V2(3, 1);
    parentEnt.transform.rotation = -90;
    
    // scale: (-24, -9, 60, 40)
    // rotate: (-9, 24-60, 40, 60)
    // translate: (-9-100, 24-30-60, 40, 60)
    deepClose(renderer.getWorldBounds(), new Rect(-9-100, 24-30-60, 40, 60), epsilon, 'world transform');
});


// screen is 256 x 512
