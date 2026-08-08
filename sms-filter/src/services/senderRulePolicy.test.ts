import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseSenderRuleInput,
  senderRuleMatches,
  setSenderCategory,
  setSenderWhitelistState,
} from './senderRulePolicy';

test('aynı göndericinin eski karşıt kuralını kaldırıp tek yeni kategori bırakır', () => {
  const original = [
    { id: 'old', keyword: 'BANKA', type: 'word' as const, category: 'junk' as const, matchTarget: 'sender' as const },
    { id: 'other', keyword: 'bahis', type: 'word' as const, category: 'junk' as const, matchTarget: 'content' as const },
  ];

  const updated = setSenderCategory(original, 'banka', 'allowed', 'new');

  assert.equal(updated.length, 2);
  assert.deepEqual(updated[0], {
    id: 'new',
    keyword: 'banka',
    type: 'word',
    category: 'allowed',
    matchTarget: 'sender',
    matchMode: 'exact',
  });
  assert.deepEqual(updated[1], original[1]);
  assert.equal(original[0].category, 'junk');
});

test('manuel gönderici düzeltmesi dört kategoriyi destekler ve en yüksek önceliğe alınır', () => {
  const original = [
    { id: 'content', keyword: 'kart', type: 'word' as const, category: 'junk' as const, matchTarget: 'content' as const },
    { id: 'old-a', keyword: 'BANKKART', type: 'word' as const, category: 'allowed' as const, matchTarget: 'sender' as const },
    { id: 'old-b', keyword: 'bankkart', type: 'word' as const, category: 'promotion' as const, matchTarget: 'sender' as const },
  ];

  const transaction = setSenderCategory(original, 'Bankkart', 'transaction', 'transaction-id');
  const promotion = setSenderCategory(original, 'Bankkart', 'promotion', 'promotion-id');

  assert.deepEqual(transaction[0], {
    id: 'transaction-id', keyword: 'Bankkart', type: 'word', category: 'transaction', matchTarget: 'sender', matchMode: 'exact',
  });
  assert.equal(transaction.filter(rule => rule.matchTarget === 'sender').length, 1);
  assert.equal(transaction[1], original[0]);
  assert.equal(promotion[0].category, 'promotion');
  assert.equal(original.length, 3);
});

test('güvenli listeye büyük küçük harf duyarsız ve tekrarsız ekler, spam seçiminde çıkarır', () => {
  const whitelist = ['Banka'];
  assert.deepEqual(setSenderWhitelistState(whitelist, 'banka', true), ['Banka']);
  assert.deepEqual(setSenderWhitelistState(whitelist, 'BANKA', false), []);
  assert.deepEqual(whitelist, ['Banka']);
});

test('manuel gönderici girdisi eski mesaj fallback akışı için sınırlı ve güvenlidir', () => {
  assert.equal(parseSenderRuleInput('  Bankkart  '), 'Bankkart');
  assert.equal(parseSenderRuleInput('+905551112233'), '+905551112233');
  assert.equal(parseSenderRuleInput(''), null);
  assert.equal(parseSenderRuleInput('x'.repeat(65)), null);
  assert.equal(parseSenderRuleInput('Bank\nKart'), null);
  assert.equal(parseSenderRuleInput('Bank\u202eKart'), null);
});

test('gönderen kuralı alt metin değil tam ve büyük-küçük harf duyarsız eşleşir', () => {
  assert.equal(senderRuleMatches('BANKKART', 'bankkart'), true);
  assert.equal(senderRuleMatches('Bankkart', 'Bank'), false);
  assert.equal(senderRuleMatches('+905551112233', '5551112233'), false);
});
