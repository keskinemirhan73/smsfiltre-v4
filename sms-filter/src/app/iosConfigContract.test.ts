import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const configureApp = require('../../app.config.js');

test('iOS Team ID projede kalici kalir ve yalnizca gecerli degerle ezilir', () => {
  const previousValue = process.env.EXPO_APPLE_TEAM_ID;

  try {
    delete process.env.EXPO_APPLE_TEAM_ID;
    const withoutTeam = configureApp({ config: {} });
    assert.equal(withoutTeam.ios.appleTeamId, '334UHSY5U9');

    process.env.EXPO_APPLE_TEAM_ID = 'AB12CD34EF';
    const withTeam = configureApp({ config: {} });
    assert.equal(withTeam.ios.appleTeamId, 'AB12CD34EF');

    process.env.EXPO_APPLE_TEAM_ID = 'invalid';
    assert.throws(() => configureApp({ config: {} }), /10 karakter/);
  } finally {
    if (previousValue === undefined) delete process.env.EXPO_APPLE_TEAM_ID;
    else process.env.EXPO_APPLE_TEAM_ID = previousValue;
  }
});

test('iOS ana uygulama, uzanti ve App Group kimlikleri ayni kokte kalir', () => {
  const config = configureApp({ config: {} });
  assert.equal(config.ios.bundleIdentifier, 'com.filtreai.app');
  assert.equal(config.ios.config.usesNonExemptEncryption, false);
  assert.deepEqual(
    config.ios.entitlements['com.apple.security.application-groups'],
    ['group.com.filtreai.app'],
  );
  assert.equal(
    config.extra.eas.build.experimental.ios.appExtensions[0].bundleIdentifier,
    'com.filtreai.app.messagefilter',
  );
});
