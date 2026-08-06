import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mergeNativeSmsEvents,
  parseNativeSmsEventQueues,
  parseNativeSmsEvents,
} from './nativeSmsEvents';

test('native SMS olaylarini dogrular ve bozuk girdileri atar', () => {
  const events = parseNativeSmsEvents(JSON.stringify([
    {
      id: 'event-1',
      sender: '***2233',
      preview: 'Şüpheli SMS algılandı.',
      status: 'suspicious',
      timestamp: 1_000,
    },
    { id: '', sender: '555', status: 'allowed', timestamp: 2_000 },
    { id: 'event-2', sender: '***', status: 'unknown', timestamp: 3_000 },
  ]));

  assert.equal(events.length, 1);
  assert.equal(events[0].id, 'event-1');
});

test('yeni native olaylari gecmise ve sayaclara yalnizca bir kez ekler', () => {
  const result = mergeNativeSmsEvents(
    [{
      id: 'old', sender: '***0000', preview: 'Eski', status: 'allowed',
      category: 'allowed', timestamp: 500,
    }],
    { blockedCount: 1, analyzedCount: 4, transactionCount: 1, promotionCount: 0 },
    ['already-imported'],
    [
      {
        id: 'new-suspicious', sender: '***2233', preview: 'Şüpheli SMS algılandı.',
        status: 'suspicious', timestamp: 2_000,
      },
      {
        id: 'new-transaction', sender: '***4455', preview: 'İşlem SMS’i algılandı.',
        status: 'transaction', timestamp: 1_500,
      },
      {
        id: 'already-imported', sender: '***6677', preview: 'Tekrar',
        status: 'promotion', timestamp: 1_000,
      },
    ],
  );

  assert.equal(result.importedCount, 2);
  assert.deepEqual(result.stats, {
    blockedCount: 2,
    analyzedCount: 6,
    transactionCount: 2,
    promotionCount: 0,
  });
  assert.deepEqual(result.history.map(item => item.id), [
    'new-suspicious', 'new-transaction', 'old',
  ]);
  assert.deepEqual(result.processedIds.slice(0, 3), [
    'new-suspicious', 'new-transaction', 'already-imported',
  ]);
});

test('native olay listelerini ve islenmis kimlikleri sinirlar', () => {
  const events = Array.from({ length: 80 }, (_, index) => ({
    id: `event-${index}`,
    sender: '***0000',
    preview: 'SMS analiz edildi.',
    status: 'allowed',
    timestamp: index + 1,
  }));

  const parsed = parseNativeSmsEvents(JSON.stringify(events));
  const result = mergeNativeSmsEvents(
    [],
    { blockedCount: 0, analyzedCount: 0, transactionCount: 0, promotionCount: 0 },
    Array.from({ length: 190 }, (_, index) => `old-${index}`),
    parsed,
  );

  assert.equal(parsed.length, 50);
  assert.equal(result.history.length, 50);
  assert.equal(result.processedIds.length, 200);
});

test('ayri native uretici kuyruklarini bozuk kuyruktan etkilenmeden birlestirir', () => {
  const filterQueue = JSON.stringify([{
    id: 'filter-1', sender: '***1111', preview: 'Filtrelendi',
    status: 'suspicious', timestamp: 1_000,
  }]);
  const reportQueue = JSON.stringify([{
    id: 'report-1', sender: '***2222', preview: 'Panelde seçildi',
    status: 'transaction', timestamp: 2_000,
  }, {
    id: 'filter-1', sender: '***1111', preview: 'Tekrar',
    status: 'suspicious', timestamp: 1_000,
  }]);

  const events = parseNativeSmsEventQueues([filterQueue, '{bozuk', reportQueue]);

  assert.deepEqual(events.map(event => event.id), ['filter-1', 'report-1']);
});
