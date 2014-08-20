// jshint ignore: start

largeModule('Entity');

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

    comp.expect(CallbackTester.OnCreate, 'call onCreate while attaching to entity');
    comp.expect(CallbackTester.OnEnable, 'then call onEnable if entity active', true);
    obj.addComponent(comp); // onEnable

    strictEqual(comp.entity, obj, 'can get entity from component');

    comp.expect(CallbackTester.OnDisable);
    obj.active = false; // onDisable

    comp.expect(CallbackTester.OnEnable);
    obj.active = true;  // onEnable

    strictEqual(obj.getComponent(FIRE.Transform), obj.transform, 'getComponent: can get transform');
    strictEqual(obj.getComponent(MyComponent), comp, 'getComponent: can get my component');
    strictEqual(obj.getComponent(MyComponentBase), comp, 'getComponent: can get component by base type');

    comp.expect(CallbackTester.OnDisable, 'should called onDisable when destory');

    comp.destroy();     // onDisable
    
    comp.notExpect(CallbackTester.OnDisable, 'onDisable should called only once');
    comp.destroy();

    strictEqual(obj.getComponent(MyComponent), comp, 'can still get component in this frame');

    comp.expect(CallbackTester.OnDestroy);
    FIRE.FObject._deferredDestroy();    // onDestroy

    strictEqual(obj.getComponent(MyComponent), null, 'can not get component after this frame');
});

test('component in hierarchy', 4, function () {
    // 这里主要测试entity，不是测试component
    var parent = new Entity();
    var child = new Entity();
    child.transform.parent = parent.transform;
    parent.active = false;

    var comp = new CallbackTester();
    comp.expect(CallbackTester.OnCreate, 'call onCreate while attaching to entity');
    child.addComponent(comp);

    comp.expect(CallbackTester.OnEnable, 'should enable when parent become active');
    parent.active = true;   // onEnable

    comp.expect(CallbackTester.OnDisable, 'should disable when parent become deactive');
    parent.active = false;   // onDisable

    comp.expect(CallbackTester.OnEnable, 'should enable when entity detached from its parent');
    child.transform.parent = null;
});

test('destroy', function () {
    var parent = new Entity();
    var child = new Entity();

    // add child component
    var childComp = child.addComponent(new CallbackTester().expect([CallbackTester.OnCreate, CallbackTester.OnEnable]));
    
    // expect ondisable
    childComp.expect(CallbackTester.OnDisable, 'should disable while destroy parent');
    childComp.notExpect(CallbackTester.OnDestroy, 'can not destroyed before the end of this frame');

    child.transform.parent = parent.transform;
    // call destroy
    parent.destroy();
    
    childComp.notExpect(CallbackTester.OnDisable, 'child comp should only disabled once');
    childComp.notExpect(CallbackTester.OnEnable, 'child component should not re-enable when parent destroying');
    childComp.expect(CallbackTester.OnDestroy, 'should destroyed at the end of frame');

    // try add component after destroy

    var childComp_new = new CallbackTester();
    childComp_new.expect(CallbackTester.OnCreate, 'new child component should onCreate even if added after destroy');
    childComp_new.expect(CallbackTester.OnEnable, 'new child component should enable even if added after destroy', true);
    childComp_new.expect(CallbackTester.OnDisable, 'new component\'s onDisable should be called before its onDestroy', true);
    childComp_new.expect(CallbackTester.OnDestroy, 'new component should also destroyed at the end of frame', true);
    child.addComponent(childComp_new);

    var newParentComp = new CallbackTester();
    newParentComp.expect([CallbackTester.OnCreate,
                          CallbackTester.OnEnable,
                          CallbackTester.OnDisable,
                          CallbackTester.OnDestroy]);
    parent.addComponent(newParentComp);

    // try add child after destroy

    var newChildEntity = new Entity();
    newChildEntity.transform.parent = parent.transform;
    newChildEntity.addComponent(new CallbackTester().expect([CallbackTester.OnCreate,
                                                             CallbackTester.OnEnable,
                                                             CallbackTester.OnDisable,
                                                             CallbackTester.OnDestroy]));

    // do destory

    FIRE.FObject._deferredDestroy();

    strictEqual(childComp_new.isValid, false, 'entity will finally destroyed with its component which added after calling destroy');
    strictEqual(childComp.isValid, false, 'entity will destroyed with its child components');
    strictEqual(child.isValid, false, 'entity will destroyed with its children');
    strictEqual(newChildEntity.isValid, false, 'entity will destroyed with its new children');
});

// jshint ignore: end
