( function () {
	QUnit.module( 'sentry', QUnit.newMwEnvironment() );

	QUnit.test( 'initRaven()', function ( assert ) {
		window.Raven = window.Raven || undefined; // sinon.js won't stub nonexistent properties
		this.sandbox.stub( window, 'Raven', {
			config: this.sandbox.stub().returnsThis(),
			install: this.sandbox.stub().returnsThis()
		} );

		this.sandbox.stub( mw.loader, 'using' ).returns( $.Deferred().resolve() );

		return mw.sentry.initRaven().then( function ( raven /* , traceKitOnError */ ) {
			assert.strictEqual( raven, Raven, 'initRaven() returns Raven as a promise' );
			assert.true( Raven.config.called, 'Raven is configured' );
			assert.true( Raven.install.called, 'Raven is installed' );

			Raven.config.reset();
			Raven.install.reset();

			return mw.sentry.initRaven();
		} ).then( function ( raven /* , traceKitOnError */ ) {
			assert.strictEqual( raven, Raven, 'initRaven() returns Raven on second invocation' );
			assert.strictEqual( Raven.config.called, false, 'Raven is not configured twice' );
			assert.strictEqual( Raven.install.called, false, 'Raven is not installed twice' );
		} );
	} );

	QUnit.test( 'report()', function ( assert ) {
		var raven = { captureException: this.sandbox.stub() };

		this.sandbox.stub( mw.sentry, 'initRaven' ).returns( $.Deferred().resolve( raven ) );

		mw.sentry.report( 'some-topic', { exception: 42, source: 'Deep Thought' } );
		assert.strictEqual( raven.captureException.lastCall.args[ 0 ], 42, 'Exception matches' );
		assert.strictEqual( raven.captureException.lastCall.args[ 1 ].tags.source, 'Deep Thought', 'Source matches' );

		mw.sentry.report( 'some-topic', { exception: 42, source: 'Deep Thought', module: 'foo' } );
		assert.strictEqual( raven.captureException.lastCall.args[ 1 ].tags.module, 'foo', 'Module matches' );

		mw.sentry.report( 'some-topic', { exception: 42, source: 'Deep Thought', context: { foo: 'bar' } } );
		assert.strictEqual( raven.captureException.lastCall.args[ 1 ].tags.foo, 'bar', 'Custom context matches' );
	} );
}() );
