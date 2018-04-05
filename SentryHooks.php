<?php

use Wikimedia\Rdbms\DBQueryError;

class SentryHooks {

	/**
	 * @param array &$vars
	 * @return bool
	 */
	public static function onResourceLoaderGetConfigVars( &$vars ) {
		global $wgSentryDsn, $wgSentryWhitelist, $wgSentryLogOnError;

		$vars['wgSentry'] = [
			'dsn' => self::getPublicDsnFromFullDsn( $wgSentryDsn ),
			'whitelist' => $wgSentryWhitelist,
			'logOnError' => $wgSentryLogOnError,
		];

		return true;
	}

	/**
	 * @param OutputPage &$out
	 * @param Skin &$skin
	 * @return bool
	 */
	public static function onBeforePageDisplay( &$out, &$skin ) {
		$out->addModules( [ 'sentry.init' ] );

		return true;
	}

	public static function onResourceLoaderTestModules(
		array &$testModules,
		ResourceLoader &$resourceLoader
	) {
		$testModules['qunit']['sentry.test'] = [
			'scripts' => [ 'init.test.js' ],
			'dependencies' => [ 'sentry.init' ],
			'localBasePath' => __DIR__ . '/tests/qunit',
			'remoteExtPath' => 'Sentry/tests/qunit',
		];
	}

	/**
	 * For JS logging, the private key must be omitted from the DSN.
	 * @param string $dsn
	 * @return string
	 */
	protected static function getPublicDsnFromFullDsn( $dsn ) {
		$slash_pos = strpos( $dsn, '//' );
		$colon_pos = strpos( $dsn, ':', $slash_pos );
		$at_pos = strpos( $dsn, '@' );
		if ( $colon_pos < 1 || $at_pos < 1 || $colon_pos > $at_pos ) {
			// something wrong - maybe $dsn is already public?
			return $dsn;
		}
		return substr( $dsn, 0, $colon_pos ) . substr( $dsn, $at_pos );
	}

	/**
	 * @param Exception|Throwable $e
	 * @param bool $suppressed True if the error is below the level set in error_reporting().
	 * @return bool
	 */
	public static function onLogException( $e, $suppressed ) {
		global $wgSentryDsn, $wgSentryLogPhpErrors, $wgVersion;

		if ( !$wgSentryLogPhpErrors || $suppressed ) {
			return true;
		}

		$client = new Raven_Client( $wgSentryDsn );

		$data = [
			'tags' => [
				'host' => wfHostname(),
				'wiki' => wfWikiID(),
				'version' => $wgVersion,
			],
		];
		if ( isset( $e->_mwLogId ) ) {
			$data['event_id'] = $e->_mwLogId;
		}
		if ( $e instanceof DBQueryError ) {
			$data['culprit'] = $e->fname;
		}

		$client->captureException( $e, $data );
		if ( $client->getLastError() !== null ) {
			wfDebugLog( 'sentry', 'Sentry error: ' . $client->getLastError() );
		}

		return true;
	}
}
