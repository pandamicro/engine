// jshint ignore: start

largeModule('Transform');

test('test', function () {
    var obj1 = new FIRE.Entity();
    var child1 = new FIRE.Entity();
    var child2 = new FIRE.Entity();

    var parent = obj1.transform;
    strictEqual(parent.parent, null, 'transform\'s default parent is null');
    strictEqual(parent.childCount, 0, 'transform\'s default child count is 0');

    child1.transform.parent = parent;
    strictEqual(child1.transform.parent, parent, 'can get/set parent');
    strictEqual(parent.childCount, 1, 'child count increased to 1');
    strictEqual(parent.getChild(0), child1.transform, 'can get child1');

    child2.transform.parent = parent;
    strictEqual(parent.childCount, 2, 'child count increased to 2');
    strictEqual(parent.getChild(1), child2.transform, 'can get child2');

    child1.destroy();

    FIRE.FObject._deferredDestroy();

    strictEqual(parent.childCount, 1, 'child count should return to 1');
    strictEqual(parent.getChild(0), child2.transform, 'only child2 left');

    // TODO: what if parent.parent = child2 ?
});

// jshint ignore: end
