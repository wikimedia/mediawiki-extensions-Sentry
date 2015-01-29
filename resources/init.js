( function ( mw ) {
	var raven;

	/**
	 * @return {jQuery.Deferred} a deferred with the Raven.js object
	 */
	function initRaven() {
		return mw.loader.using( 'sentry' ).then( function () {
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
	 * @param {string} data.source Describes what type of function caught the exception
	 * @param {string} [data.module] Name of the module which threw the exception
	 */
	function report( topic, data ) {
		initRaven().done( function ( raven ) {
			raven.captureException( data.exception, { tags: {
				source: data.source,
				module: data.module
			} } );
		} );
	}

	mw.trackSubscribe( 'errorLogging.exception', report );
	mw.trackSubscribe( 'resourceloader.exception', report );
} ) ( mediaWiki );
