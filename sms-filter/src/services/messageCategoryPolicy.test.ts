import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MESSAGE_CATEGORY_OPTIONS,
  createManualCategoryHistory,
  resolveUserRuleCategory,
} from './messageCategoryPolicy';

test('kullanıcıya dört net ve benzersiz SMS kategorisi sunulur', () => {
  assert.deepEqual(MESSAGE_CATEGORY_OPTIONS.map(option => option.key), [
    'junk', 'allowed', 'transaction', 'promotion',
  ]);
  assert.equal(new Set(MESSAGE_CATEGORY_OPTIONS.map(option => option.label)).size, 4);
});

test('manuel kategori değişikliği uygulama geçmişinde görünür bir kayıt üretir', () => {
  assert.deepEqual(createManualCategoryHistory('Bankkart', 'transaction'), {
    sender: 'Bankkart',
    preview: 'Gönderici manuel olarak İşlem ve Bilgilendirme kategorisine alındı.',
    status: 'transaction',
    category: 'transaction',
    source: 'manual',
  });
  assert.equal(createManualCategoryHistory('Banka', 'junk').status, 'blocked');
});

test('kesin gönderici kuralı kategori filtreleri kapalı olsa da manuel tercihi uygular', () => {
  assert.equal(resolveUserRuleCategory('transaction', 'sender', false, false, 'exact'), 'transaction');
  assert.equal(resolveUserRuleCategory('promotion', 'sender', false, false, 'exact'), 'promotion');
  assert.equal(resolveUserRuleCategory('transaction', 'sender', false, false), 'allowed');
  assert.equal(resolveUserRuleCategory('transaction', 'content', false, false), 'allowed');
  assert.equal(resolveUserRuleCategory('promotion', 'both', false, false), 'allowed');
});
