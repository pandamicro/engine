module('entity');

var Entity = FIRE.Entity;

test('basic test', function () {
    var entity = new Entity();
    ok(entity.name, 'entity has name');
    strictEqual(entity.active, true, 'entity is active');
    strictEqual(entity.activeInHierarchy, true, 'entity is activeInHierarchy');

    entity.active = false;

    strictEqual(entity.active, false, 'entity is deactive');
    strictEqual(entity.activeInHierarchy, false, 'entity is deactiveInHierarchy');

    entity._destroyImmediate();
    strictEqual(entity.isValid, false, 'entity can be destoryed');
});

test('hierarchy', function () {
    var parent = new Entity();
    var child = new Entity();

    child.transform.parent = parent.transform;

    strictEqual(parent.activeInHierarchy, true, 'parent activeInHierarchy');
    strictEqual(child.activeInHierarchy, true, 'child activeInHierarchy');

    child.active = false;

    strictEqual(parent.activeInHierarchy, true, 'parent unchanged');
    strictEqual(child.activeInHierarchy, false, 'child deactiveInHierarchy');

    parent.active = false;

    strictEqual(parent.activeInHierarchy, false, 'parent deactiveInHierarchy');
    strictEqual(child.activeInHierarchy, false, 'child still deactiveInHierarchy');

    child.active = true;

    strictEqual(parent.activeInHierarchy, false, 'parent unchanged');
    strictEqual(child.activeInHierarchy, false, 'child deactiveInHierarchy because parent deactived');

    parent.active = true;

    strictEqual(parent.activeInHierarchy, true, 'parent become activeInHierarchy');
    strictEqual(child.activeInHierarchy, true, 'child become activeInHierarchy because parent actived');
});

test('component', function () {
    // my base component
    function MyComponentBase () {
        FIRE.Component.call(this);
    }
    FIRE.extend(MyComponentBase, FIRE.Component);
    // my component
    function MyComponent () {
        MyComponentBase.call(this);
    }
    FIRE.extend(MyComponent, MyComponentBase);

    // 这里主要测试entity，不是测试component
    expect(10);

    var obj = new Entity();
    var comp = new MyComponent();
    comp.onEnable = function () {
        ok(true, 'should call onEnable');
    }
    comp.onDisable = function () {
        ok(false, 'should not call onDisable when adding');
    }

    obj.addComponent(comp); // onEnable

    strictEqual(comp.entity, obj, 'can get entity from component');

    comp.onDisable = function () {
        ok(true, 'should call onDisable now');
    }

    obj.active = false; // onDisable
    obj.active = true;  // onEnable

    strictEqual(obj.getComponent(FIRE.Transform), obj.transform, 'getComponent: can get transform');
    strictEqual(obj.getComponent(MyComponent), comp, 'getComponent: can get my component');
    strictEqual(obj.getComponent(MyComponentBase), comp, 'getComponent: can get component by base type');

    comp.destroy();     // onDisable

    strictEqual(obj.getComponent(MyComponent), comp, 'can still get component in this frame');

    FIRE.FObject._deferredDestroy();    // onDestroy

    strictEqual(obj.getComponent(MyComponent), null, 'can not get component after this frame');
});

test('component in hierarchy', function () {
    // 这里主要测试entity，不是测试component
    var parent = new Entity();
    var child = new Entity();
    child.transform.parent = parent.transform;
    parent.active = false;

    expect(3);

    var comp = new FIRE.Component();
    comp.onEnable = function () {
        ok(false, 'should not call onEnable if entity deactive');
    }
    
    child.addComponent(comp);

    comp.onEnable = function () {
        ok(true, 'should enable when parent become active');
    }

    parent.active = true;   // onEnable

    comp.onDisable = function () {
        ok(true, 'should disable when parent become deactive');
    }

    parent.active = false;   // onDisable

    comp.onEnable = function () {
        ok(true, 'should enable when entity detached from its parent');
    }

    child.transform.parent = null;
});

// TODO: test destory entity
