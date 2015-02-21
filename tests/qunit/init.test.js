( function ( mw, $ ) {
	QUnit.module( 'sentry', QUnit.newMwEnvironment() );

	QUnit.test( 'initRaven()', 6, function ( assert ) {
		var result;

		this.sandbox.stub( mw.loader, 'using' ).returns( $.Deferred().resolve() );
		this.sandbox.stub( Raven, 'config' ).returnsThis();
		this.sandbox.stub( Raven, 'install' ).returnsThis();

		QUnit.stop();
		mw.sentry.initRaven().then( function ( raven ) {
			assert.strictEqual( raven, Raven, 'initRaven() returns Raven as a promise' );
			assert.ok( Raven.config.called, 'Raven is configured' );
			assert.ok( Raven.install.called, 'Raven is installed' );

			Raven.config.reset();
			Raven.install.reset();

			return mw.sentry.initRaven();
		} ).then( function ( raven ) {
			assert.strictEqual(raven, Raven, 'initRaven() returns Raven on second invocation' );
			assert.ok( !Raven.config.called, 'Raven is not configured twice' );
			assert.ok( !Raven.install.called, 'Raven is not installed twice' );
			QUnit.start();
		} );
	} );

	QUnit.test( 'report()', 5, function ( assert ) {
		var raven = { captureException: this.sandbox.stub() };

		this.sandbox.stub( mw.sentry, 'initRaven' ).returns( $.Deferred().resolve( raven ) );

		mw.sentry.report( 'some-topic', { exception: 42, source: 'Deep Thought', id: '123' } );
		assert.strictEqual( raven.captureException.lastCall.args[0], 42, 'Exception matches' );
		assert.strictEqual( raven.captureException.lastCall.args[1].event_id, '123', 'Event id matches' );
		assert.strictEqual( raven.captureException.lastCall.args[1].tags.source, 'Deep Thought', 'Source matches' );

		mw.sentry.report( 'some-topic', { exception: 42, source: 'Deep Thought', module: 'foo', id: '123' } );
		assert.strictEqual( raven.captureException.lastCall.args[1].tags.module, 'foo', 'Module matches' );

		mw.sentry.report( 'some-topic', { exception: 42, source: 'Deep Thought', id: '123', context: { foo: 'bar' } } );
		assert.strictEqual( raven.captureException.lastCall.args[1].tags.foo, 'bar', 'Custom context matches' );
	} );
}( mediaWiki, jQuery ) );
