<?php

/**
 * @group Sentry
 */
class SentryHooksTest extends PHPUnit\Framework\TestCase {
	/**
	 * @covers SentryHooks::getPublicDsnFromFullDsn()
	 */
	public function testGetPublicDsnFromFullDsn() {
		$getPublicDsnFromFullDsn = new ReflectionMethod( SentryHooks::class, 'getPublicDsnFromFullDsn' );

		// normal
		$dsn = 'http://public_key:secret_key@example.com/project-id';
		$publicDsn = $getPublicDsnFromFullDsn->invoke( null, $dsn );
		$this->assertEquals( 'http://public_key@example.com/project-id', $publicDsn );

		// protocol-relative
		$dsn = '//public_key:secret_key@example.com/project-id';
		$publicDsn = $getPublicDsnFromFullDsn->invoke( null, $dsn );
		$this->assertEquals( '//public_key@example.com/project-id', $publicDsn );

		// already public
		$dsn = 'http://public_key@example.com/project-id';
		$publicDsn = $getPublicDsnFromFullDsn->invoke( null, $dsn );
		$this->assertEquals( 'http://public_key@example.com/project-id', $publicDsn );
	}
}
