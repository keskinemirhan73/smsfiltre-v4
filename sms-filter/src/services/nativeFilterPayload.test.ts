import assert from 'node:assert/strict';
import test from 'node:test';

import { buildNativeFilterPayload } from './nativeFilterPayload';

test('native filtre paketi kurallari, ayarlari ve tehdit veritabanini birlikte tasir', () => {
  const payload = JSON.parse(buildNativeFilterPayload(
    [{ id: '1', keyword: 'bahis', type: 'word', category: 'junk', matchTarget: 'content' }],
    { smartFilter: true },
    {
      blacklistedNumbers: ['+905551112233'],
      spamKeywords: ['casino'],
      scamUrls: ['example.invalid'],
      regexPatterns: ['b[.]a[.]h[.]i[.]s'],
    },
  ));

  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.rules[0].keyword, 'bahis');
  assert.equal(payload.settings.smartFilter, true);
  assert.deepEqual(payload.threatDb, [
    { keyword: '+905551112233', type: 'number' },
    { keyword: 'casino', type: 'word' },
    { keyword: 'example.invalid', type: 'word' },
    { keyword: 'b[.]a[.]h[.]i[.]s', type: 'regex' },
  ]);
});

test('native filtre paketi bos ve gecersiz tehdit girdilerini atar', () => {
  const payload = JSON.parse(buildNativeFilterPayload([], {}, {
    blacklistedNumbers: ['', '  '],
    spamKeywords: ['spam', ''],
    scamUrls: [],
    regexPatterns: ['   '],
  }));

  assert.deepEqual(payload.threatDb, [{ keyword: 'spam', type: 'word' }]);
});

test('native filtre paketi gecersiz ve pahali kullanici regexlerini reddeder', () => {
  const payload = JSON.parse(buildNativeFilterPayload([
    { id: 'safe-word', keyword: '+90555', type: 'word', category: 'allowed', matchTarget: 'sender' },
    { id: 'safe-regex', keyword: 'B[0-9]{3}', type: 'regex', category: 'junk', matchTarget: 'content' },
    { id: 'broken', keyword: '[', type: 'regex', category: 'junk', matchTarget: 'content' },
    { id: 'expensive', keyword: '(a+)+$', type: 'regex', category: 'junk', matchTarget: 'content' },
  ], {}, {
    blacklistedNumbers: [], spamKeywords: [], scamUrls: [], regexPatterns: [],
  }));

  assert.deepEqual(payload.rules.map((rule: { id: string }) => rule.id), [
    'safe-word', 'safe-regex',
  ]);
});
