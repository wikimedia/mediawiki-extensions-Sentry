<?php

if ( function_exists( 'wfLoadExtension' ) ) {
	wfLoadExtension( 'Sentry' );
	// Keep i18n globals so mergeMessageFileList.php doesn't break
	$wgMessagesDirs['Sentry'] = __DIR__ . '/i18n';
	wfWarn(
		'Deprecated PHP entry point used for Sentry extension. Please use wfLoadExtension instead, ' .
		'see https://www.mediawiki.org/wiki/Extension_registration for more details.'
	);
	return;
} else {
	die( 'This version of the Sentry extension requires MediaWiki 1.25+' );
}
