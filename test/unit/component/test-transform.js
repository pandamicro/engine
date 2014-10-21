// jshint ignore: start

largeModule('Transform', TestEnv);

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

test('getLocalMatrix', function () {
    var parent = new Fire.Entity();
    parent.transform.position = new V2(432, 54354);
    parent.transform.scale = new V2(21, 32);
    parent.transform.rotation = 3241;
    var ent = new Fire.Entity();
    var transform = ent.transform;
    transform.parent = parent.transform;

    transform.scale = new V2(1, 2);
    transform.rotation = -90;
    transform.position = new V2(0, 4);

    var mat = transform.getLocalMatrix();

    close(mat.getRotation(), transform.rotation * 0.017453292519943295, 0.0001, 'rotate');
    deepClose(mat.getScale(), transform.scale, 0.0001, 'scale');
    deepClose(new V2(mat.tx, mat.ty), transform.position, 0.0001, 'translate');

    //var rotateMat = new M3();
    //rotateMat.rotate();
    //var scaleMat = new M3();
    //scaleMat.setScale(transform.scale);
    //var sr = rotateMat.prepend(scaleMat);
});

test('worldPosition/Rotation', function () {
    var parent = new Fire.Entity();
    var child = new Fire.Entity();
    child.transform.parent = parent.transform;

    parent.transform.position = new V2(432, 54354);
    parent.transform.scale = new V2(21, 32);
    parent.transform.rotation = 3241;

    deepClose(parent.transform.worldPosition, parent.transform.position, 0.0001, 'worldPosition equals localPosition if no parent');
    deepClose(parent.transform.worldRotation, parent.transform.rotation % 360, 0.0001, 'worldRotation equals localRotation if no parent');
    deepClose(parent.transform.worldScale, parent.transform.scale, 0.0001, 'worldScale equals localScale if no parent');

    child.transform.position = new V2(-21, 4);
    child.transform.scale = new V2(1, 2);
    child.transform.rotation = -212;

    //console.log(child.transform.getLocalToWorldMatrix());

    var worldPosition = new V2(-11.16675, 54474.28);
    deepClose(child.transform.worldPosition, worldPosition, 0.01, 'get world position');

    var localPosition = child.transform.position.clone();
    child.transform.worldPosition = worldPosition;
    deepClose(child.transform.position, localPosition, 0.1, 'set local position');

    //var expectedWorldRotation = child.transform.rotation + parent.transform.rotation;
    //deepClose(child.transform.worldRotation, expectedWorldRotation % 360, 0.0001, 'get world rotation');

    //var localRotation = child.transform.rotation;
    //child.transform.worldRotation = expectedWorldRotation;
    //deepClose(child.transform.rotation, localRotation, 0.0001, 'set world rotation');

    var expectedWorldScale = new V2(24.08897, 57.82209);
    deepClose(child.transform.worldScale, expectedWorldScale, 1, 'get world scale');
});

// jshint ignore: end
