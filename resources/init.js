( function ( mw, Raven ) {
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
} ) ( mediaWiki, Raven );
