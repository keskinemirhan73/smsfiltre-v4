import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCustomRuleKeyword } from './customRuleInput';

test('telefon numarasi regex yerine normal kural olarak yorumlanir', () => {
  assert.deepEqual(parseCustomRuleKeyword('  +905551112233  '), {
    keyword: '+905551112233',
    type: 'word',
  });
});

test('gecerli regex kabul edilir; bozuk veya pahali regex reddedilir', () => {
  assert.deepEqual(parseCustomRuleKeyword('B[0-9]{3}'), {
    keyword: 'B[0-9]{3}',
    type: 'regex',
  });
  assert.equal(parseCustomRuleKeyword('['), null);
  assert.equal(parseCustomRuleKeyword('(a+)+$'), null);
});

test('bos ve asiri uzun kurallar reddedilir', () => {
  assert.equal(parseCustomRuleKeyword('   '), null);
  assert.equal(parseCustomRuleKeyword('x'.repeat(201)), null);
});
