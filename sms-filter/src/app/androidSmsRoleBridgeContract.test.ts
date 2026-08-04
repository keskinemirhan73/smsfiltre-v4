import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

test('Android rol koprusu ROLE_SMS durumunu kontrol eder ve sistem penceresini kullanir', () => {
  const moduleSource = readFileSync(
    resolve(projectRoot, 'targets/android-messaging/DefaultSmsRoleModule.kt'),
    'utf8',
  );

  assert.match(moduleSource, /RoleManager\.ROLE_SMS/);
  assert.match(moduleSource, /isRoleAvailable\(RoleManager\.ROLE_SMS\)/);
  assert.match(moduleSource, /isRoleHeld\(RoleManager\.ROLE_SMS\)/);
  assert.match(moduleSource, /createRequestRoleIntent\(RoleManager\.ROLE_SMS\)/);
  assert.match(moduleSource, /Telephony\.Sms\.Intents\.ACTION_CHANGE_DEFAULT/);
  assert.doesNotMatch(moduleSource, /READ_SMS|RECEIVE_SMS/);
  assert.doesNotMatch(moduleSource, /Log\.|println\(/);
});

test('rol koprusu paket kaydi ve config plugin kopyalama adimlariyla birlikte gelir', () => {
  const packageSource = readFileSync(
    resolve(projectRoot, 'targets/android-messaging/DefaultSmsRolePackage.kt'),
    'utf8',
  );
  const pluginSource = readFileSync(
    resolve(projectRoot, 'plugins/withAndroidSmsFilter.js'),
    'utf8',
  );

  assert.match(packageSource, /DefaultSmsRoleModule/);
  assert.match(pluginSource, /targets.*android-messaging/s);
  assert.match(pluginSource, /DefaultSmsRoleModule\.kt/);
  assert.match(pluginSource, /DefaultSmsRolePackage\.kt/);
  assert.match(pluginSource, /DefaultSmsRolePackage/);
});

test('varsayilan SMS ozelligi app configte kullaniciya acik degildir', () => {
  const appConfig = JSON.parse(readFileSync(resolve(projectRoot, 'app.json'), 'utf8'));
  const plugin = appConfig.expo.plugins.find(
    (entry: unknown) => Array.isArray(entry) && entry[0] === './plugins/withAndroidSmsFilter.js',
  );

  assert.deepEqual(plugin, [
    './plugins/withAndroidSmsFilter.js',
    { enableDefaultSms: false },
  ]);
});

test('tam teslim katmani hazir oldugunda config plugin rol modunu kabul eder', () => {
  const pluginSource = readFileSync(
    resolve(projectRoot, 'plugins/withAndroidSmsFilter.js'),
    'utf8',
  );

  assert.match(pluginSource, /DEFAULT_SMS_RUNTIME_READY = true/);

  const withAndroidSmsFilter = require(
    resolve(projectRoot, 'plugins/withAndroidSmsFilter.js'),
  ) as (config: object, options: { enableDefaultSms: boolean }) => { modResults?: unknown };

  const dummyConfig = {
    android: { package: 'com.filtreai.app' },
    modResults: {
      manifest: {
        'uses-permission': [],
        'uses-feature': [],
        application: [{ $: { 'android:name': '.MainApplication' }, activity: [], receiver: [] }],
      },
    },
  };

  assert.doesNotThrow(() => withAndroidSmsFilter(dummyConfig, { enableDefaultSms: true }));
});
