// jshint ignore: start

largeModule('Component', {
    setup: function () {
        if (!Engine.inited) {
            Engine.init();
        }
    }
});
/*
test('onHierarchyChanged invoked by setting parent', function () {
    var MyComp = Fire.define('', Component);
    var onHierarchyChanged = MyComp.prototype.onHierarchyChanged = new callback();

    var parent1 = new Entity();
    var parent2 = new Entity();
    parent2.transform.parent = parent1.transform;

    var ent = new Entity();
    ent.active = false;
    var comp = ent.addComponent(MyComp);
    ent.transform.parent = parent1.transform;
    onHierarchyChanged.setDisabledMessage('should not invoked before onLoad');

    ent.transform.parent = null;
    ent.active = true;

    onHierarchyChanged.enable();
    ent.transform.parent = parent1.transform;
    onHierarchyChanged.once('should invoke if set parent');

    ent.transform.parent = null;
    onHierarchyChanged.once('should invoke if no parent');

    ent.transform.parent = parent2.transform;
    onHierarchyChanged.calledCount = 0;

    parent2.transform.parent = null;
    onHierarchyChanged.once('should invoke if parent\'s hierarchy changed');

    onHierarchyChanged.disable();
    comp.destroy();
});
*/
// jshint ignore: end
