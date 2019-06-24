/* eslint camelcase: ["error", {properties: "never"}] */
( function () {
	var ravenPromise,
		errorCount = 0,
		EVENT_GATE_SHELL = {
			$schema: '/client/error/1.0.0',
			meta: { stream: 'client.error' }
		};

	/**
	 * @return {jQuery.Deferred} a deferred with two values: the Raven.js object and the TraceKit
	 *   error handler
	 */
	function initRaven() {
		if ( !ravenPromise ) {
			ravenPromise = mw.loader.using( 'sentry.raven' ).then( function () {
				var config = mw.config.get( 'wgSentry' ),
					options = {},
					oldOnError,
					traceKitOnError;

				// If EventGate is configured, this extension will send errors to it.
				// However, it needs to configure the sentry dsn to initialize Raven
				if ( config.eventGateUri ) {
					config.dsn = config.dsn || 'https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@sentry.io/project';
				} else if ( !config.dsn ) {
					mw.log.error( 'See README for how to configure Sentry server' );
				}

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
					page_name: mw.config.get( 'wgPageName' ),
					user_groups: mw.config.get( 'wgUserGroups' ),
					language: mw.config.get( 'wgUserLanguage' )
				};

				options.shouldSendCallback = function ( data ) {
					var wrappedData;
					// don't flood the server / freeze the client when something generates
					// an endless stream of errors
					if ( errorCount++ >= 5 ) {
						Raven.uninstall();
						return false;
					}

					if ( config.eventGateUri ) {
						// hijack the actual sending and POST to EventGate
						// TODO: this is for beta testing only, we need to implement it properly as
						//       we work on productionizing
						wrappedData = $.extend( {}, EVENT_GATE_SHELL, data );
						$.post( config.eventGateUri, wrappedData )
							.fail( function ( error ) {
								mw.log.warn( 'POSTing error to Sentry failed', error );
							} );
						return false;
					}

					return true;
				};

				// Annoyingly, there is no way to install Raven/TraceKit without it taking over
				// the global error handler (and chaining the old handler after itself).
				oldOnError = window.onerror;
				window.onerror = null;
				try {
					Raven.config( config.dsn, options ).install();
				} catch ( e ) {
					window.onerror = oldOnError;
					mw.log.error( e );
					return $.Deferred().reject( e );
				}
				traceKitOnError = window.onerror;
				window.onerror = oldOnError;

				return $.Deferred().resolve( Raven, traceKitOnError );
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
		mw.sentry.initRaven().done( function ( raven /* , traceKitOnError */ ) {
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
	 *
	 * There is no way to stop Raven from replacing window.onerror (https://github.com/getsentry/raven-js/issues/316)
	 * and it will pass errors to the old handler after reporting them, so we need a temporary
	 * handler to avoid double reporting. This handler will load Raven the first time it is called,
	 * and handle errors until Raven is loaded; once that happens, Raven handles errors on its own
	 * and this handler needs to be removed.
	 *
	 * @param {string} topic mw.track() queue name
	 * @param {Object} data
	 */
	function handleGlobalError( topic, data ) {
		mw.sentry.initRaven().done( function ( raven, traceKitOnError ) {
			traceKitOnError.call(
				window,
				data.errorMessage,
				data.url,
				data.lineNumber,
				data.columnNumber,
				data.errorObject
			);
		} );
	}

	// make these available for unit tests
	mw.sentry = { initRaven: initRaven, report: report };

	mw.trackSubscribe( 'resourceloader.exception', report );

	mw.trackSubscribe( 'global.error', handleGlobalError );

	mw.trackSubscribe( 'eventlogging.error', function ( topic, error ) {
		mw.sentry.initRaven().done( function ( raven /* , traceKitOnError */ ) {
			raven.captureMessage( error, { source: 'EventLogging' } );
		} );
	} );
}() );
