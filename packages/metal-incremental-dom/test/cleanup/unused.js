'use strict';

import Component from 'metal-component';
import IncrementalDomRenderer from '../../src/IncrementalDomRenderer';
import { disposeUnused, schedule } from '../../src/cleanup/unused';
import { getData } from '../../src/data';
import IncrementalDOM from '../../src/incremental-dom';

describe('unused', function() {
	var comp;
	var grandchild;

	beforeEach(function() {
		class GrandChild extends Component {
			created() {
				grandchild = this;
			}
		}
		GrandChild.RENDERER = IncrementalDomRenderer;

		class Child extends Component {
			render() {
				IncrementalDOM.elementVoid(GrandChild);
			}
		}
		Child.RENDERER = IncrementalDomRenderer;

		class Parent extends Component {
			render() {
				IncrementalDOM.elementOpen('div');
				IncrementalDOM.elementVoid(Child, null, null, 'ref', 'child1');
				IncrementalDOM.elementVoid(Child, null, null, 'ref', 'child2');
				IncrementalDOM.elementClose('div');
			}
		}
		Parent.RENDERER = IncrementalDomRenderer;
		comp = new Parent();
	});

	afterEach(function() {
		if (comp) {
			comp.dispose();
		}
	});

	it('should dispose scheduled components', function() {
		var comps = [comp.components.child1, comp.components.child2];
		schedule(comps);
		disposeUnused();

		assert.ok(comps[0].isDisposed());
		assert.ok(comps[1].isDisposed());
	});

	it('should not dispose scheduled components that have received a new parent', function() {
		var comps = [comp.components.child1, comp.components.child2];
		schedule(comps);
		getData(comps[0]).parent = comp;
		disposeUnused();

		assert.ok(!comps[0].isDisposed());
		assert.ok(comps[1].isDisposed());
	});

	it('should not dispose scheduled components that have been disposed before scheduled', function() {
		var comps = [comp.components.child1, comp.components.child2];
		comps[0].dispose();
		schedule(comps);
		sinon.spy(comps[0], 'dispose');
		sinon.spy(comps[1], 'dispose');
		disposeUnused();

		assert.strictEqual(0, comps[0].dispose.callCount);
		assert.strictEqual(1, comps[1].dispose.callCount);
	});

	it('should not dispose scheduled components that have been disposed after scheduled', function() {
		var comps = [comp.components.child1, comp.components.child2];
		schedule(comps);
		comps[0].dispose();
		sinon.spy(comps[0], 'dispose');
		sinon.spy(comps[1], 'dispose');
		disposeUnused();

		assert.strictEqual(0, comps[0].dispose.callCount);
		assert.strictEqual(1, comps[1].dispose.callCount);
	});

	it('should not throw error when `disposeUnused` is called during another `disposeUnused` call', function() {
		sinon.stub(comp.components.child1, 'disposed', () => {
			disposeUnused();
		});

		var comps = [comp.components.child1];
		schedule(comps);

		assert.doesNotThrow(() => disposeUnused());
		assert.ok(comps[0].isDisposed());
	});

	it('should not throw error when disposing component that has an owner that was previously disposed', function() {
		var comps = [comp.components.child2, grandchild];
		schedule(comps);
		assert.doesNotThrow(() => disposeUnused());
	});
});
