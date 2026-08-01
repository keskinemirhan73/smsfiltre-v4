import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCommunityRules } from './communityRulesPolicy';

test('geçerli ve sınırlı topluluk kurallarını kabul eder', () => {
  assert.deepEqual(
    parseCommunityRules([{ keyword: 'bahis', type: 'word' }]),
    [{ keyword: 'bahis', type: 'word' }],
  );
});

test('bozuk topluluk kuralı yanıtını reddeder', () => {
  assert.throws(
    () => parseCommunityRules([{ keyword: '<script>', type: 'unknown' }]),
    /Geçersiz topluluk kuralları/,
  );
  assert.throws(
    () => parseCommunityRules([{ keyword: '(a+)+$', type: 'regex' }]),
    /Geçersiz topluluk kuralları/,
  );
});
