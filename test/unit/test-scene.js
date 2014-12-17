// jshint ignore: start

largeModule('Scene', TestEnv);

test('new entity', function () {
    var ent = new Entity();
    strictEqual(Engine._scene.entities[0], ent, 'new entity should created in scene');
});

test('findEntity', function () {
    var ent = new Entity('');

    ok(Entity.find('/') === ent, 'should found, empty name');

    var ent2 = new Entity('.去');
    ok(Entity.find('/.去') === ent2, 'should found, Chinese name');

    var entent = new Entity('');
    entent.parent = ent;
    ok(Entity.find('//') === entent, 'should found, empty name * 2');

    var ent2ent2 = new Entity('Jare Guo');
    ent2ent2.parent = ent2;
    ok(Entity.find('/.去/Jare Guo') === ent2ent2, 'should found, name contains space');
});

// This function has moved to editor
//test('createEntity in other scene', function () {
//    var previewScene = new Fire._Scene();
//    var ent = previewScene.createEntity('preview entity');
//    ok(Entity.find('/preview entity') === null, 'should not create in main scene');
//    ok(previewScene.findEntity('/preview entity') === ent, 'should create in preview scene');
//});

// jshint ignore: end
