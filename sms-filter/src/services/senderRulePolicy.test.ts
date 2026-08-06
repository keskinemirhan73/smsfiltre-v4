import assert from 'node:assert/strict';
import test from 'node:test';

import { setSenderCategory, setSenderWhitelistState } from './senderRulePolicy';

test('aynı göndericinin eski karşıt kuralını kaldırıp tek yeni kategori bırakır', () => {
  const original = [
    { id: 'old', keyword: 'BANKA', type: 'word' as const, category: 'junk' as const, matchTarget: 'sender' as const },
    { id: 'other', keyword: 'bahis', type: 'word' as const, category: 'junk' as const, matchTarget: 'content' as const },
  ];

  const updated = setSenderCategory(original, 'banka', 'allowed', 'new');

  assert.equal(updated.length, 2);
  assert.deepEqual(updated[0], original[1]);
  assert.deepEqual(updated[1], {
    id: 'new',
    keyword: 'banka',
    type: 'word',
    category: 'allowed',
    matchTarget: 'sender',
  });
  assert.equal(original[0].category, 'junk');
});

test('güvenli listeye büyük küçük harf duyarsız ve tekrarsız ekler, spam seçiminde çıkarır', () => {
  const whitelist = ['Banka'];
  assert.deepEqual(setSenderWhitelistState(whitelist, 'banka', true), ['Banka']);
  assert.deepEqual(setSenderWhitelistState(whitelist, 'BANKA', false), []);
  assert.deepEqual(whitelist, ['Banka']);
});
