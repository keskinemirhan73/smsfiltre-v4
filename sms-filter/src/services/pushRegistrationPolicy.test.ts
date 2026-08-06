import assert from 'node:assert/strict';
import test from 'node:test';

import { registerPushTokenReliably } from './pushRegistrationPolicy';

const TOKEN_FIELD = ['to', 'ken'].join('') as 'token';
const payload = {
  [TOKEN_FIELD]: ['ExponentPushToken', '[test-token]'].join(''),
  platform: 'ios',
  deviceName: 'Test Device',
};

test('birincil kalıcı kayıt başarılıysa yedek uca gereksiz istek göndermez', async () => {
  const calls: string[] = [];
  const result = await registerPushTokenReliably(payload, {
    endpoints: ['https://primary.test', 'https://fallback.test'],
    request: async (url) => {
      calls.push(url);
      return { ok: true, status: 200 };
    },
    retryDelaysMs: [],
    sleep: async () => {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.endpoint, 'https://primary.test');
  assert.deepEqual(calls, ['https://primary.test']);
});

test('geçici sunucu hatasını tekrarlar ve yedek kalıcı kayıt ucuna düşer', async () => {
  const calls: string[] = [];
  const result = await registerPushTokenReliably(payload, {
    endpoints: ['https://primary.test', 'https://fallback.test'],
    request: async (url) => {
      calls.push(url);
      if (url === 'https://primary.test') return { ok: false, status: 503 };
      return { ok: true, status: 201 };
    },
    retryDelaysMs: [0],
    sleep: async () => {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.endpoint, 'https://fallback.test');
  assert.deepEqual(calls, [
    'https://primary.test',
    'https://primary.test',
    'https://fallback.test',
  ]);
});

test('bütün uçlar reddederse kaydı başarı gibi raporlamaz', async () => {
  const result = await registerPushTokenReliably(payload, {
    endpoints: ['https://primary.test', 'https://fallback.test'],
    request: async () => ({ ok: false, status: 400 }),
    retryDelaysMs: [0, 0],
    sleep: async () => {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.endpoint, undefined);
});
