module('Transform');

var Transform = FIRE.Transform;

test('test', function () {
    var obj1 = new FIRE.Entity();
    var obj2 = new FIRE.Entity();
    var obj3 = new FIRE.Entity();

    var parent = obj1.transform;
    strictEqual(parent.parent, null, 'transform\'s default parent is null');
    strictEqual(parent.childCount, 0, 'transform\'s default child count is 0');

    var child1 = obj2.transform;
    child1.parent = parent;
    strictEqual(child1.parent, parent, 'can get/set parent');
    strictEqual(parent.childCount, 1, 'child count increased to 1');
    strictEqual(parent.getChild(0), child1, 'can get child1');

    var child2 = obj3.transform;
    child2.parent = parent;
    strictEqual(parent.childCount, 2, 'child count increased to 2');
    strictEqual(parent.getChild(1), child2, 'can get child2');

    child1.destroy();

    // still available ?

    FIRE.FObject._deferredDestroy();

    strictEqual(parent.childCount, 1, 'child count backs to 1');
    strictEqual(parent.getChild(0), child2, 'only child2 left');

    // TODO: what if parent.parent = child2 ?
});
