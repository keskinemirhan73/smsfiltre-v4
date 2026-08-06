import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const appSource = readFileSync(resolve(process.cwd(), 'App.tsx'), 'utf8');

test('push token degisikliklerini ve uygulama on plana donusunu yeniden kaydeder', () => {
  assert.match(appSource, /Notifications\.addPushTokenListener/);
  assert.match(appSource, /AppState\.addEventListener\(['"]change['"]/);
  assert.match(appSource, /syncPushTokenWithBackend\(token\.data\)/);
  assert.match(appSource, /getExistingExpoPushTokenAsync/);
  assert.match(
    appSource,
    /state\s*===\s*['"]active['"][\s\S]*FilterManager\.importNativeSmsEvents\(\)/,
  );
});

test('push yasam dongusu aboneliklerini kapanista temizler', () => {
  assert.match(appSource, /pushTokenSub\.remove\(\)/);
  assert.match(appSource, /appStateSub\.remove\(\)/);
});
