var THIS_IS_FUNC = '~-=(){}=-~';

module('context', {
	setup: function() {
		this.client = io.Context();
	},
	teardown: function() {
		this.client.socket.disconnect();
	}
});

test('client has updatable context', function() {
	ok(this.client.context);
	// set initial context
	this.client.update({foo: 'bar', deep: {ly: ['array']}}, {silent: true});
	deepEqual(this.client.context, {foo: 'bar', deep: {ly: ['array']}});
	// update existing props
	this.client.update({foo: 'baz', deep: {ly: ['array',1]}}, {silent: true});
	deepEqual(this.client.context, {foo: 'baz', deep: {ly: ['array',1]}});
	// mixed update
	this.client.update({bar: null, deep: {ly: {nested: ['array',0,false,true,undefined,null]}}}, {silent: true});
	deepEqual(this.client.context, {foo: 'baz', deep: {ly: {nested: ['array',0,false,true,undefined,null]}}});
	// replace context
	this.client.update({foo: 1}, {silent: true, reset: true});
	deepEqual(this.client.context, {foo: 1});


	// immutable props
	// skipped
	this.client.update({_foo: 1, deep: null}, {silent: true});
	deepEqual(this.client.context, {foo: 1});
	// foo is copied, so any underlined props become immutable
	this.client.update({foo: {_bar: 1, baz: 2}}, {silent: true});
	deepEqual(this.client.context, {foo: {_bar: 1, baz: 2}});


});

test('client properly obeys update rules', function() {
	ok(this.client.context);
	function foo() {}
	// set function
	this.client.update({a: foo}, {silent: true});
	deepEqual(this.client.context, {a: foo});
	// reset by ordinal
	this.client.update({a: 1}, {silent: true});
	deepEqual(this.client.context, {a: 1});
	// reset by array
	this.client.update({a: [1]}, {silent: true});
	deepEqual(this.client.context, {a: [1]});
	// reset by hash
	this.client.update({a: {b:1}}, {silent: true});
	deepEqual(this.client.context, {a: {b:1}});
	// reset by ordinal
	this.client.update({a: 2}, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by empty
	this.client.update({}, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by null
	this.client.update(null, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by undefined
	this.client.update(undefined, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by number
	this.client.update(2, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by string
	this.client.update('2', {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by Date
	this.client.update(new Date, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by function
	this.client.update(foo, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by regexp
	this.client.update(/asd/, {silent: true});
	deepEqual(this.client.context, {a: 2});
	// augment by array
	this.client.update([1,2,3], {silent: true});
	deepEqual(this.client.context, {a: 2});
	// remove
	this.client.update({a: undefined}, {silent: true});
	deepEqual(this.client.context, {});
});

test('client properly deals with functions', function() {
	ok(this.client.context);
	function foo() {}
	function bar() {}
	// set real function
	this.client.update({deep: foo}, {silent: true});
	deepEqual(this.client.context, {deep: foo});
	// reset by real function
	this.client.update({deep: bar}, {silent: true});
	deepEqual(this.client.context, {deep: bar});
	// reset by remote function
	this.client.update({deep: THIS_IS_FUNC}, {silent: true});
	ok(typeof this.client.context.deep === 'function');
	// remove function
	this.client.update({deep: null}, {silent: true});
	deepEqual(this.client.context, {});
	// set remote function
	this.client.update({deep: {deeper: {foo: THIS_IS_FUNC}}}, {silent: true});
	ok(typeof this.client.context.deep.deeper.foo === 'function');
});

test('client allows chaining', function() {
	ok(this.client.context);
	this.client
		.update({a: 1}, {silent: true})
		.update({b: 2, a: {c: 3}}, {silent: true});
	deepEqual(this.client.context, {a: {c: 3}, b: 2});
});

test('client allows continuation', function() {
	var cli = this.client;
	ok(cli.context);
	cli.update({a: 1}, {silent: true}, function(err, changes) {
		ok(err === null);
		deepEqual(changes, {a: 1});
		cli.update({b: 2, a: {c: 3}}, {silent: true}, function(err, changes) {
			ok(err === null);
			deepEqual(changes, {a: {c: 3}, b: 2});
			deepEqual(cli.context, {a: {c: 3}, b: 2});
		});
	});
});

test('client properly reports changes', function() {
	var cli = this.client;
	ok(cli.context);
	function foo() {}
	function bar() {}
	cli.update({foo: foo});
	cli.on('change', function(ochanges, achanges) {
		ok(cli === this);
		// N.B. since ochanges go to remote side, we report functions as signatures
		deepEqual(ochanges, {foo: THIS_IS_FUNC, a: 1, b: {c: {d: 2}}});
		// N.B. achanges for local use, so functions are functions
		deepEqual(achanges, [[['foo'], bar], [['a'],1], [['b', 'c', 'd'],2]]);
	});
	cli.update({foo: bar, a: 1, b: {c: {d: 2}}});
	deepEqual(cli.context, {foo: bar, a: 1, b: {c: {d: 2}}});
});

test('client properly reports no changes', function() {
	//expect(2);
	var cli = this.client;
	ok(cli.context);
	cli.update({a: 1, b: {c: {d: 2}}});
	cli.on('change', function(ochanges, achanges) {
		// N.B. you should never reach here
		ok(false);
	});
	cli.update({a: 1, b: {c: {d: 2}}});
	deepEqual(cli.context, {a: 1, b: {c: {d: 2}}});
});
