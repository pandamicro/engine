
module('Camera');

function resize (w, h) {
    if (!Engine.inited) {
        Engine.init(w, h);
    }
    else {
        Engine.screenSize = new V2(w, h);
    }
}

test('viewportToScreen', function () {
    resize(256, 512);

    var cam = new Camera();

    ok(cam.viewportToScreen(V2.zero).equals(new V2(0, 0)));
    ok(cam.viewportToScreen(new V2(0.5, 0.5)).equals(new V2(128, 256)));
    ok(cam.viewportToScreen(V2.one).equals(new V2(256, 512)));
});
