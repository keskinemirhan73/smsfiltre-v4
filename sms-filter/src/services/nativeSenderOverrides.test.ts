import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mergePendingSenderCorrections,
  parseNativeSenderOverride,
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
