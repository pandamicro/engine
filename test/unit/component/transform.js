// jshint ignore: start

largeModule('Transform', {
    setup: function () {
        if (!Engine.inited) {
            Engine.init();
        }
    }
});

test('test', function () {
    var parentEntity = new Fire.Entity();
    var child1 = new Fire.Entity();
    var child2 = new Fire.Entity();

    var parent = parentEntity.transform;
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

    FO._deferredDestroy();

    strictEqual(parent.childCount, 1, 'child count should return to 1');
    strictEqual(parent.getChild(0), child2.transform, 'only child2 left');

    // TODO: what if parent.parent = child2 ?

});

test('isChildOf', function () {
    var ent1 = new Fire.Entity();
    var ent2 = new Fire.Entity();
    var ent3 = new Fire.Entity();

    ent2.transform.parent = ent1.transform;
    ent3.transform.parent = ent2.transform;

    strictEqual(ent1.transform.isChildOf(ent2.transform), false, 'not a child of its children');
    strictEqual(ent1.transform.isChildOf(ent1.transform), true, 'is child of itself');
    strictEqual(ent2.transform.isChildOf(ent1.transform), true, 'is child of its parent');
    strictEqual(ent3.transform.isChildOf(ent1.transform), true, 'is child of its ancestor');
});

// jshint ignore: end
