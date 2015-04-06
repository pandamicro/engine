
module('Camera', TestEnv);

test('viewportToScreen', function () {
    var ent = new Entity();
    var cam = ent.addComponent(Camera);

    ok(cam.viewportToScreen(V2.zero).equals(V2.zero));
    ok(cam.viewportToScreen(new V2(0.5, 0.5)).equals(new V2(128, 256)));
    ok(cam.viewportToScreen(V2.one).equals(new V2(256, 512)));
});

test('screenToViewport', function () {
    var ent = new Entity();
    var cam = ent.addComponent(Camera);

    ok(cam.screenToViewport(V2.zero).equals(V2.zero));
    ok(cam.screenToViewport(new V2(128, 256)).equals(new V2(0.5, 0.5)));
    ok(cam.screenToViewport(new V2(256, 512)).equals(V2.one));
});

test('screenToWorld', function () {
    var ent = new Entity();
    var cam = ent.addComponent(Camera);
    cam.contentStrategy = Fire.ContentStrategyType.NoScale;
    deepEqual(cam.screenToWorld(V2.zero), new V2(-128, 256), 'no scale 1');
    deepEqual(cam.screenToWorld(new V2(256, 512)), new V2(128, -256), 'no scale 2');

    cam.contentStrategy = Fire.ContentStrategyType.FixedHeight;
    cam.size = Fire.Screen.size.y;
    deepEqual(cam.screenToWorld(v2(256, 512)), v2(128, -256), 'fixed height 2');
    cam.size = Fire.Screen.size.y * 2;
    deepEqual(cam.screenToWorld(V2.zero), v2(-128, 256).mul(2), 'fixed height 3');

    var parent = new Entity();
    ent.parent = parent;
    parent.transform.scale = new V2(1, 2);
    parent.transform.position = new V2(30, 20);
    ent.transform.position = new V2(-5, -3);

    var screen = v2(100, 200);
    var worldPos = v2(25, 14);
    var offset = v2(-28, 56);   // offset to screen center
    cam.contentStrategy = Fire.ContentStrategyType.NoScale;
    // distance to screen center:
    deepEqual(cam.screenToWorld(screen), offset.add(worldPos), 'no scale translated');

    cam.contentStrategy = Fire.ContentStrategyType.FixedHeight;
    deepEqual(cam.screenToWorld(new V2(100, 200)), offset.mul(2).add(worldPos), 'fixed height translated');
});

test('world to screen', function () {
    var ent = new Entity();
    var cam = ent.addComponent(Camera);
    cam.contentStrategy = Fire.ContentStrategyType.NoScale;

    deepEqual(cam.worldToScreen(new V2(-128, 256)), V2.zero);
    deepEqual(cam.worldToScreen(new V2(128, -256)), new V2(256, 512));

    var ent2 = new Entity();
    ent.parent = ent2;
    ent2.transform.scale = new V2(1, 2);
    ent2.transform.position = new V2(30, 20);
    ent.transform.position = new V2(-5, -3);    // world position: 25, 14
    //                                 -28  56
    deepEqual(cam.worldToScreen(new V2(-3, 70)), new V2(100, 200));
});
