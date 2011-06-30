module('context', {
	setup: function() {
		this.client = io.Context();//{name: '/dummy'});
	},
	teardown: function() {
		this.client.socket.disconnect();
	}
});

test("client has updatable context", function() {
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

test("client properly deals with functions", function() {
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
	this.client.update({deep: '~-=(){}=-~'}, {silent: true});
	ok(typeof this.client.context.deep === 'function');
	// remove function
	this.client.update({deep: null}, {silent: true});
	deepEqual(this.client.context, {});
	// set remote function
	this.client.update({deep: {deeper: {foo: '~-=(){}=-~'}}}, {silent: true});
	ok(typeof this.client.context.deep.deeper.foo === 'function');
});

test("client properly obeys update rules", function() {
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
});
