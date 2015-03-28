( function ( mw, $ ) {
	var raven;

	/**
	 * @return {jQuery.Deferred} a deferred with the Raven.js object
	 */
	function initRaven() {
		return mw.loader.using( 'sentry.raven' ).then( function () {
			if ( !raven ) {
				var config = mw.config.get( 'wgSentry' ),
					options = {};

				if ( config.whitelist ) {
					options.whitelistUrls = config.whitelist.slice( 0 );
					options.whitelistUrls.push( location.host );
				}
				options.collectWindowErrors = config.logOnError;
				options.tags = {
					version: mw.config.get( 'wgVersion' ),
					debug: mw.config.get( 'debug' ),
					skin: mw.config.get( 'skin' ),
					action: mw.config.get( 'wgAction' ),
					ns: mw.config.get( 'wgNamespaceNumber' ),
					pageName: mw.config.get( 'wgPageName' ),
					userGroups: mw.config.get( 'wgUserGroups' ),
					language: mw.config.get( 'wgUserLanguage' )
				};

				// FIXME: https://github.com/getsentry/raven-js/issues/316
				// There is no way to use Raven without installing it as the global error handler;
				// and it will pass all errors to the previously registered error handler, which
				// would cause duplicate reports.
				window.onerror = undefined;

				Raven.config( config.dsn, options ).install();

				raven = Raven;
			}
			return raven;
		} );
	}

	/**
	 * @param {string} topic mw.track() queue name
	 * @param {Object} data
	 * @param {Mixed} data.exception The exception which has been caught
	 * @param {string} data.id An identifier for the exception
	 * @param {string} data.source Describes what type of function caught the exception
	 * @param {string} [data.module] Name of the module which threw the exception
	 * @param {Object} [data.context] Additional key-value pairs to be recorded as Sentry tags
	 */
	function report( topic, data ) {
		mw.sentry.initRaven().done( function ( raven ) {
			var tags = { source: data.source };

			if ( data.module ) {
				tags.module = data.module;
			}
			$.extend( tags, data.context );

			raven.captureException( data.exception, { tags: tags } );
		} );
	}

	// make these available for unit tests
	mw.sentry = { initRaven: initRaven, report: report };

	mw.trackSubscribe( 'resourceloader.exception', report );

	mw.trackSubscribe( 'global.error', function ( topic, data ) {
		mw.sentry.initRaven().done( function ( raven ) {
			// By this point, Raven replaced the old window.onerror; we need to process errors
			// caught before that which are queued in mw.track.
			window.onerror.call( window, data.errorMessage, data.url, data.lineNumber, data.columnNumber,
				data.errorObject );
		} );
	} );

	mw.trackSubscribe( 'eventlogging.error', function ( topic, error ) {
		mw.sentry.initRaven().done( function ( raven ) {
			raven.captureMessage( error, { source: 'EventLogging' } );
		} );
	} );
} ) ( mediaWiki, jQuery );
