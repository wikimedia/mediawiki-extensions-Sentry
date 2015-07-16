( function ( mw, $ ) {
	var ravenPromise;

	/**
	 * @return {jQuery.Deferred} a deferred with the Raven.js object
	 */
	function initRaven() {
		if ( !ravenPromise ) {
			ravenPromise = mw.loader.using( 'sentry.raven' ).then( function () {
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

				Raven.config( config.dsn, options ).install();

				mw.trackUnsubscribe( handleGlobalError );

				return Raven;
			} );
		}
		return ravenPromise;
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

	/**
	 * Handles global.error events.
	 * There is no way to stop Raven from replacing window.onerror (https://github.com/getsentry/raven-js/issues/316)
	 * and it will pass errors to the old handler after reporting them, so we need a temporary handler to avoid
	 * double reporting. This handler will load Raven the first time it is called, and handle errors until Raven is
	 * loaded; once that happens, Raven handles errors on its own and this handler needs to be removed.
	 * @param {string} topic mw.track() queue name
	 * @param {Object} data
	 */
	function handleGlobalError( topic, data ) {
		mw.sentry.initRaven().done( function ( raven ) {
			// By this point, Raven replaced the old window.onerror; we need to process errors
			// caught before that which are queued in mw.track.
			window.onerror.call( window, data.errorMessage, data.url, data.lineNumber, data.columnNumber,
				data.errorObject );
		} );
	}

	// make these available for unit tests
	mw.sentry = { initRaven: initRaven, report: report };

	mw.trackSubscribe( 'resourceloader.exception', report );

	mw.trackSubscribe( 'global.error',  handleGlobalError );

	mw.trackSubscribe( 'eventlogging.error', function ( topic, error ) {
		mw.sentry.initRaven().done( function ( raven ) {
			raven.captureMessage( error, { source: 'EventLogging' } );
		} );
	} );
} ) ( mediaWiki, jQuery );
