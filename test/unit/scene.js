// jshint ignore: start

largeModule('Scene', {
    setup: function () {
        if (!Engine.inited) {
            Engine.init();
        }
        // force clear scene
        Engine._scene = new FIRE._Scene();
    }
});

test('findEntity', function () {
    var ent = new Entity('');

    ok(Entity.find('/') === ent, 'should found, empty name');
    
    var ent2 = new Entity('.去');
    ok(Entity.find('/.去') === ent2, 'should found, Chinese name');

    var entent = new Entity('');
    entent.transform.parent = ent.transform;
    ok(Entity.find('//') === entent, 'should found, empty name * 2');

    var ent2ent2 = new Entity('Jare Guo');
    ent2ent2.transform.parent = ent2.transform;
    ok(Entity.find('/.去/Jare Guo') === ent2ent2, 'should found, name contains space');
});

test('createEntity', function () {
    var previewScene = new FIRE._Scene();
    var ent = previewScene.createEntity('preview entity');
    ok(Entity.find('/preview entity') === null, 'should not create in main scene');
    ok(previewScene.findEntity('/preview entity') === ent, 'should create in preview scene');
});

// jshint ignore: end
