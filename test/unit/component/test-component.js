// jshint ignore: start

largeModule('Component', TestEnv);

/*
test('onHierarchyChanged invoked by setting parent', function () {
    var MyComp = Fire.define('', Component);
    var onHierarchyChanged = MyComp.prototype.onHierarchyChanged = new callback();

    var parent1 = new Entity();
    var parent2 = new Entity();
    parent2.parent = parent1;

    var ent = new Entity();
    ent.active = false;
    var comp = ent.addComponent(MyComp);
    ent.parent = parent1;
    onHierarchyChanged.setDisabledMessage('should not invoked before onLoad');

    ent.parent = null;
    ent.active = true;

    onHierarchyChanged.enable();
    ent.parent = parent1;
    onHierarchyChanged.once('should invoke if set parent');

    ent.parent = null;
    onHierarchyChanged.once('should invoke if no parent');

    ent.parent = parent2;
    onHierarchyChanged.calledCount = 0;

    parent2.parent = null;
    onHierarchyChanged.once('should invoke if parent\'s hierarchy changed');

    onHierarchyChanged.disable();
    comp.destroy();
});
*/
// jshint ignore: end
