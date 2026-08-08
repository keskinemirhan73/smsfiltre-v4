import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterUnprocessedSenderCorrections,
  mergePendingSenderCorrections,
  parseNativeSenderOverride,
  parseNativeSenderOverrideQueue,
  parsePendingSenderOverrideIds,
} from './nativeSenderOverrides';

test('native bekleyen gönderen ayarını doğrular ve bozuk girdileri reddeder', () => {
  assert.deepEqual(parseNativeSenderOverride(JSON.stringify({
    id: 'one', sender: 'BANKKART', category: 'transaction', timestamp: 1000,
  })), { id: 'one', sender: 'BANKKART', category: 'transaction', timestamp: 1000 });
  assert.equal(parseNativeSenderOverride(JSON.stringify({
    id: 'bad', sender: 'x'.repeat(65), category: 'junk', timestamp: 1000,
  })), null);
  assert.equal(parseNativeSenderOverride('{bozuk'), null);
});

test('bekleyen kimlik listesini sınırlar ve bozuk değerleri atar', () => {
  assert.deepEqual(
    parsePendingSenderOverrideIds(JSON.stringify(['one', '', 42, 'x'.repeat(129), 'two'])),
    ['one', 'two'],
  );
});

test('bekleyen ayarlar kimliğe göre tekrarsız ve en yeni önce birleştirilir', () => {
  const merged = mergePendingSenderCorrections(
    [{ id: 'old', sender: 'BANK', category: 'junk', timestamp: 500 }],
    [
      { id: 'new', sender: 'BANKKART', category: 'transaction', timestamp: 2000 },
      { id: 'old', sender: 'BANK', category: 'allowed', timestamp: 1000 },
    ],
  );

  assert.deepEqual(merged.map(item => [item.id, item.category]), [
    ['new', 'transaction'], ['old', 'allowed'],
  ]);
});

test('aynı gönderen için yalnız en yeni bekleyen kategori gösterilir', () => {
  const merged = mergePendingSenderCorrections(
    [{ id: 'old', sender: 'BANKKART', category: 'junk', timestamp: 10 }],
    [{ id: 'new', sender: 'bankkart', category: 'transaction', timestamp: 20 }],
  );

  assert.deepEqual(merged, [
    { id: 'new', sender: 'bankkart', category: 'transaction', timestamp: 20 },
  ]);
});

test('dayanikli native kuyruk gecerli secimleri okur ve bozuk kayitlari atar', () => {
  const valid = {
    id: 'pending-one', sender: 'BANKKART', category: 'junk' as const, timestamp: 1000,
  };
  const invalid = {
    id: 'pending-bad', sender: 'BANKKART', category: 'unknown', timestamp: 1001,
  };

  assert.deepEqual(
    parseNativeSenderOverrideQueue(JSON.stringify([valid, invalid, valid])),
    [valid],
  );
  assert.deepEqual(parseNativeSenderOverrideQueue('{bozuk'), []);
});

test('guvenli depoya alinan native secimler yeniden ice aktarilmaz', () => {
  const corrections = [
    { id: 'pending-one', sender: 'BANKKART', category: 'junk' as const, timestamp: 1000 },
    { id: 'pending-two', sender: 'BILINMEYEN', category: 'allowed' as const, timestamp: 1001 },
  ];

  assert.deepEqual(
    filterUnprocessedSenderCorrections(corrections, ['pending-one']),
    [corrections[1]],
  );
});
