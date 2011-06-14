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
	// set functions
	function foo() {}
	this.client.update({foo: [null], deep: foo}, {silent: true});
	deepEqual(this.client.context, {foo: [null], deep: foo});
	//ok(typeof client.context.timer === 'function');
});
