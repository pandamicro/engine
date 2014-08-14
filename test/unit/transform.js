module('Transform');

var Transform = FIRE.Transform;

test('test', function () {

    var parent = new Transform();
    strictEqual(parent.parent, null, 'transform\'s default parent is null');
    strictEqual(parent.childCount, 0, 'transform\'s default child count is 0');

    var child = new Transform();
    strictEqual(child.parent, null, 'transform\'s default parent is null');
});
