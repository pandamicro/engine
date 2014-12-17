
module('Entity Event', TestEnv);

test('getCapturingTargets and getBubblingTargets', function () {
    // define hierarchy
    var node1 = new Fire.Entity();
    var node2 = new Fire.Entity();
    var node3 = new Fire.Entity();
    node2.parent = node1;
    node3.parent = node2;

    var event = new Fire.Event('fire', true);
    var capture1 = new Callback();
    var capture2 = new Callback();
    var capture3 = new Callback();
    var bubble1 = new Callback();
    var bubble2 = new Callback();
    var bubble3 = new Callback();
    // capture1 -> capture2 -> bubble2 -> bubble1
    node1.on('fire', capture1, true);
    node2.on('fire', capture2, true);
    node3.on('fire', capture3, true);
    node1.on('fire', bubble1, false);
    node2.on('fire', bubble2, false);
    node3.on('fire', bubble3, false);

    var list = [];
	list.length = 0;
    node1._getCapturingTargets('fire', list);
	strictEqual(list.length, 0, 'no capturing targets can dispatched from root');

	list.length = 0;
    node1._getBubblingTargets('fire', list);
	strictEqual(list.length, 0, 'no bubbling targets can dispatched from root');

	list.length = 0;
    node3._getCapturingTargets('fire', list);
    var expect = [node2, node1];
    deepEqual(list, expect, 'can get capturing targets for node3');

	list.length = 0;
    node3._getBubblingTargets('fire', list);
    var expect = [node2, node1];
    deepEqual(list, expect, 'can get bubbling targets for node3');

	// deactive
    node2.active = false;

	list.length = 0;
    node3._getCapturingTargets('fire', list);
    var expect = [node1];
    deepEqual(list, expect, 'should not invoke deactive entity in capture phase');

	list.length = 0;
    node3._getBubblingTargets('fire', list);
    var expect = [node1];
    deepEqual(list, expect, 'should not invoke deactive entity in bubble phase');
});
