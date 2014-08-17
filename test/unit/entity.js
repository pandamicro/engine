// jshint ignore: start

module('entity');

var Entity = FIRE.Entity;

test('basic test', function () {
    var entity = new Entity();
    ok(entity.name, 'entity has default name');
    strictEqual(new Entity('myEntity').name, 'myEntity', 'can specify entity name');

    strictEqual(entity.active, true, 'entity is active');
    strictEqual(entity.activeInHierarchy, true, 'entity is activeInHierarchy');

    entity.active = false;

    strictEqual(entity.active, false, 'entity is deactive');
    strictEqual(entity.activeInHierarchy, false, 'entity is deactiveInHierarchy');

    entity._destroyImmediate();
    strictEqual(entity.isValid, false, 'entity can be destoryed');
});

test('activeInHierarchy', function () {
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
    // 这里主要测试entity，不是测试component

    // my component
    var MyComponentBase = FIRE.simpleExtend(CallbackTester);
    var MyComponent = FIRE.simpleExtend(MyComponentBase);

    var obj = new Entity();
    var comp = new MyComponent();
    comp.onEnable = callback().setName('onEnable').enable();
    comp.onDisable = callback().setName('onDisable').setDisabledMessage('should not call onDisable when adding');

    obj.addComponent(comp); // onEnable

    strictEqual(comp.entity, obj, 'can get entity from component');
    comp.onEnable.once().disable('can not call onEnable when active = false');
    comp.onDisable.enable();
    
    obj.active = false; // onDisable

    comp.onEnable.enable();
    comp.onDisable.once().disable('can not call onDisable when active = true');

    obj.active = true;  // onEnable

    comp.onEnable.once().disable();
    comp.onDisable.enable();

    strictEqual(obj.getComponent(FIRE.Transform), obj.transform, 'getComponent: can get transform');
    strictEqual(obj.getComponent(MyComponent), comp, 'getComponent: can get my component');
    strictEqual(obj.getComponent(MyComponentBase), comp, 'getComponent: can get component by base type');

    comp.destroy();     // onDisable
    comp.onDisable.once('should called onDisable when destory').disable('should called only once');
    comp.destroy();     // onDisable

    strictEqual(obj.getComponent(MyComponent), comp, 'can still get component in this frame');

    FIRE.FObject._deferredDestroy();    // onDestroy

    strictEqual(obj.getComponent(MyComponent), null, 'can not get component after this frame');
});

test('component in hierarchy', 3, function () {
    rewrite
    // 这里主要测试entity，不是测试component
    var parent = new Entity();
    var child = new Entity();
    child.transform.parent = parent.transform;
    parent.active = false;

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

test('destroy', function () {
    var parent = new Entity();
    var child = new Entity();

    var childComp = child.addComponent(new FIRE.Component());
    childComp.onDisable = callback().enable();
    childComp.onDestroy = callback().setDisabledMessage('can not destroyed before the end of this frame');

    child.transform.parent = parent.transform;
    parent.destroy();

    childComp.onDisable.once('should disable while destroy parent').disable('child comp should only disabled once');

    // test added after destroy

    var newComp = new FIRE.Component();
    newComp.onEnable = callback().enable();

    child.addComponent(newComp);

    newComp.onEnable.once('new component should enable even if added after destroy').disable();

    newComp.onDisable = callback(function () {
        strictEqual(newComp.onDestroy.calledCount, 0, 'new component\'s onDisable should be called before its onDestroy');
    }).enable();
    newComp.onDestroy = callback().enable();
    
    // do destory

    childComp.onDestroy.enable()

    FIRE.FObject._deferredDestroy();

    childComp.onDestroy.once('should destroyed at the end of frame').disable();

    newComp.onDisable.once().disable();
    newComp.onDestroy.once('new component should also destroyed at the end of frame').disable();

    strictEqual(newComp.isValid, false, 'entity will finally destroyed with its component which added after calling destroy');
    strictEqual(childComp.isValid, false, 'entity will destroyed with its child components');
    strictEqual(child.isValid, false, 'entity will destroyed with its children');

});

// jshint ignore: end
