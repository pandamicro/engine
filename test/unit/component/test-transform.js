// jshint ignore: start

largeModule('Transform', TestEnv);

test('test', function () {
    var parent = new Fire.Entity();
    var child1 = new Fire.Entity();

    strictEqual(parent.transform._parent, null, 'transform\'s default parent is null');

    child1.parent = parent;
    strictEqual(child1.transform._parent, parent.transform, 'can get parent');
});

test('getLocalMatrix', function () {
    var parent = new Fire.Entity();
    parent.transform.position = new V2(432, 54354);
    parent.transform.scale = new V2(21, 32);
    parent.transform.rotation = 3241;
    var ent = new Fire.Entity();
    ent.parent = parent;

    var transform = ent.transform;
    transform.scale = new V2(1, 2);
    transform.rotation = -90;
    transform.position = new V2(0, 4);

    var mat = transform.getLocalMatrix();

    close(mat.getRotation(), transform.rotation * Math.PI / 180, 0.0001, 'rotate');
    deepClose(mat.getScale(), transform.scale, 0.0001, 'scale');
    deepClose(new V2(mat.tx, mat.ty), transform.position, 0.0001, 'translate');


    parent.transform.position = new V2(432, 54354);
    parent.transform.scale = new V2(21, 32);
    parent.transform.rotation = 3241;

    var child = new Fire.Entity();
    child.parent = parent;
    child.transform.position = new V2(-21, 4);
    child.transform.scale = new V2(1, 2);
    child.transform.rotation = -212;
    mat = child.transform.getLocalMatrix();

    close(mat.getRotation(), (child.transform.rotation + 360)* Math.PI / 180, 0.0001, 'rotate 2');
    mat = parent.transform.getLocalMatrix();
    close(mat.getRotation(), (parent.transform.rotation % 360)* Math.PI / 180, 0.0001, 'rotate 3');
    
    //var rotateMat = new M3();
    //rotateMat.rotate();
    //var scaleMat = new M3();
    //scaleMat.setScale(transform.scale);
    //var sr = rotateMat.prepend(scaleMat);
});

test('worldPosition/Rotation', function () {
    var parent = new Fire.Entity();
    var child = new Fire.Entity();
    child.parent = parent;

    parent.transform.position = new V2(432, 54354);
    parent.transform.scale = new V2(21, 32);
    parent.transform.rotation = 3241;

    child.transform.position = new V2(-21, 4);
    child.transform.scale = new V2(1, 2);
    child.transform.rotation = -212;

    deepClose(parent.transform.worldPosition, parent.transform.position, 0.0001, 'worldPosition equals localPosition if no parent');
    deepClose(parent.transform.worldRotation % 360, parent.transform.rotation % 360, 0.0001, 'worldRotation equals localRotation if no parent');
    deepClose(parent.transform.worldScale, parent.transform.scale, 0.0001, 'worldScale equals localScale if no parent');

    //console.log(child.transform.getLocalToWorldMatrix());
    
    // position

    var worldPosition = new V2(-11.16675, 54474.28);
    deepClose(child.transform.worldPosition, worldPosition, 0.01, 'get world position');

    var localPosition = child.transform.position.clone();
    child.transform.worldPosition = worldPosition;
    deepClose(child.transform.position, localPosition, 0.001, 'set world position');

    // rotation

    var expectedWorldRotation = child.transform.rotation + parent.transform.rotation;
    deepClose(child.transform.worldRotation % 360, expectedWorldRotation % 360, 1, 'get world rotation');

    var localRotation = child.transform.rotation;
    child.transform.worldRotation = expectedWorldRotation;
    deepClose((child.transform.rotation + 360) % 360, localRotation + 360, 0.001, 'set world rotation');

    // scale

    var expectedWorldScale = new V2(24.08897, 57.82209);
    deepClose(child.transform.worldScale, expectedWorldScale, 10, 'get world scale');
});

test('up, right', function () {
    var parent = new Fire.Entity();
    var child = new Fire.Entity();
    child.parent = parent;

    parent.transform.rotation = 90;     // 90
    child.transform.rotation = -180;    // -90

    deepClose(parent.transform.up, v2(-1, 0), 0.00001, 'get parent up');
    deepClose(child.transform.up, v2(1, 0), 0.00001, 'get child up');
    deepClose(parent.transform.right, v2(0, 1), 0.00001, 'get parent right');
    deepClose(child.transform.right, v2(0, -1), 0.00001, 'get child right');

    var deg30dir = v2(Math.cos(Math.deg2rad(30)) * 2, 1);

    child.transform.up = deg30dir;
    close(child.transform.worldRotation, -60, 0.00001, 'set child up');
    child.transform.right = deg30dir;
    close(child.transform.worldRotation, 30, 0.00001, 'set child right');

    parent.transform.up = deg30dir;
    close(parent.transform.worldRotation, -60, 0.00001, 'set parent up');
    parent.transform.right = deg30dir;
    close(parent.transform.worldRotation, 30, 0.00001, 'set parent right');
});

// jshint ignore: end
