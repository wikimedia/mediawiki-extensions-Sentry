<?php

/**
 * Client class from optional sentry/sentry composer package
 * @phpcs:disable MediaWiki.Files.ClassMatchesFilename,Squiz.Classes.ValidClassName.NotCamelCaps
 */
class Raven_Client {
	public function __construct( $options_or_dsn = null, $options = [] ) {
	}

	public function captureException(
		$exception, $culprit_or_options = null, $logger = null, $vars = null
	) {
	}

	/**
	 * @return string|null
	 */
	public function getLastError() {
	}
}
