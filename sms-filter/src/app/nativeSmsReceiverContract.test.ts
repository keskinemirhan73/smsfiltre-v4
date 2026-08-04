import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const receiverSource = readFileSync(
  resolve(projectRoot, 'targets/android-filter/SmsFilterReceiver.kt'),
  'utf8',
);
const pluginSource = readFileSync(
  resolve(projectRoot, 'plugins/withAndroidSmsFilter.js'),
  'utf8',
);

test('Android alici SMS govdesini saklamadan maskeli olay kuyrugu yazar', () => {
  assert.match(receiverSource, /smsfilter_event_queue_json/);
  assert.match(receiverSource, /recordSmsEvent\(/);
  assert.match(receiverSource, /maskSender\(/);
  assert.doesNotMatch(receiverSource, /put\("body"/);
  assert.doesNotMatch(receiverSource, /Log\.d\([^\n]*\$sender/);
  assert.doesNotMatch(receiverSource, /Log\.d\([^\n]*\$body/);
  assert.match(receiverSource, /previousQueue\.length\(\) - 49/);
  assert.match(receiverSource, /UUID\.randomUUID\(\)/);
});

test('Android alici dogru uygulama paketine uretilir ve sistem SMS izniyle korunur', () => {
  assert.match(pluginSource, /config\.android\.package/);
  assert.match(pluginSource, /content\.replace\(\/\^package\\s\+\.\*\$\/m/);
  assert.match(pluginSource, /android\.permission\.BROADCAST_SMS/);
  assert.match(pluginSource, /android:exported': 'true'/);
});

test('uygulama acilisinda ve panel odaklandiginda native olaylar ice aktarilir', () => {
  const appSource = readFileSync(resolve(projectRoot, 'App.tsx'), 'utf8');
  const dashboardSource = readFileSync(
    resolve(projectRoot, 'src/screens/DashboardScreen.tsx'),
    'utf8',
  );

  assert.match(appSource, /FilterManager\.importNativeSmsEvents\(\)/);
  assert.match(dashboardSource, /FilterManager\.importNativeSmsEvents\(\)/);
});
