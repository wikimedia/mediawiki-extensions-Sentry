<?php

class SentryHooks {
	/**
	 * @param array $vars
	 * @return bool
	 */
	public static function onResourceLoaderGetConfigVars( &$vars ) {
		global $wgSentryEndpoint, $wgSentryWhitelist, $wgSentryLogOnError;

		$vars['wgSentry'] = array(
			'endpoint' => $wgSentryEndpoint,
			'whitelist' => $wgSentryWhitelist,
			'logOnError' => $wgSentryLogOnError,
		);

		return true;
	}

	/**
	 * @param OutputPage $out
	 * @param Skin $skin
	 * @return bool
	 */
	public static function onBeforePageDisplay( &$out, &$skin ) {
		$out->addModules( array( 'sentry' ) );

		return true;
	}
}

