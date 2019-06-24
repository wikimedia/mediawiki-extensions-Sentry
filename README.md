Configuration
=============

This extension can send events to a Sentry server or to EventGate, depending on how you configure it.  Here is how to do that in mediawiki-vagrant and the beta cluster.

mediawiki-vagrant
=================

If EventGate is configured via `$wgSentryEventGateUri`, this extension will ignore any Sentry server configuration.  You can configure $wgSentryEventGateUri in any normal way you add configuration on Vagrant: settings.d directory, LocalSettings.php, extension.json.

If EventGate is not configured, you can set `$wgSentryDsn` in two ways.  One is to generate it with https://github.com/wikimedia/mediawiki-vagrant/blob/master/puppet/modules/sentry/templates/sentry_create_project.py.erb, this is supported by the Sentry Vagrant role.  Another is to add a file named settings.d/01-SentryCustom.php and set it there (it has to have this format because the extension validates the key, but of course it should point to a working sentry server, local or remote).

```
$wgSentryDsn = "https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@sentry.io/project";
```

beta cluster
============

We have a working EventGate instance in beta.  You can use it for testing here by setting it like:

```
$wgSentryEventGateUri = "http://eventgate-logging.wmflabs.org/v1/events";
```

If you're testing a Sentry server, you can set `$wgSentryDsn` as above.  As above, Sentry server settings will be ignored if sending to EvenGate is configured.  Since you're working in the beta cluster, send a change to update the CommonSettings-labs.php and InitializeSettings-labs.php files.
