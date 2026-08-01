import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildThreatDistribution,
  buildWeeklySuspiciousSeries,
} from './dashboardMetrics';

test('haftalık seri veri yokken sahte olay üretmez', () => {
  const now = new Date(2026, 7, 1, 12, 0, 0, 0);
  const series = buildWeeklySuspiciousSeries([], now);

  assert.equal(series.length, 7);
  assert.deepEqual(series.map(item => item.val), [0, 0, 0, 0, 0, 0, 0]);
});

test('haftalık seri yalnızca şüpheli işaretlenen gerçek olayları sayar', () => {
  const now = new Date(2026, 7, 1, 12, 0, 0, 0);
  const today = now.getTime();
  const yesterday = new Date(2026, 6, 31, 12, 0, 0, 0).getTime();

  const series = buildWeeklySuspiciousSeries([
    { timestamp: today, status: 'blocked' },
    { timestamp: today, status: 'allowed' },
    { timestamp: yesterday, status: 'blocked' },
  ], now);

  assert.deepEqual(series.slice(-2).map(item => item.val), [1, 1]);
});

test('tehdit dağılımı gerçek sayaçları kullanır ve izinli sayısını negatife düşürmez', () => {
  assert.deepEqual(
    buildThreatDistribution({
      analyzedCount: 10,
      blockedCount: 3,
      transactionCount: 2,
      promotionCount: 1,
    }),
    { blocked: 3, transaction: 2, promotion: 1, allowed: 4, total: 10 },
  );

  assert.deepEqual(
    buildThreatDistribution({
      analyzedCount: 1,
      blockedCount: 2,
      transactionCount: 0,
      promotionCount: 0,
    }).allowed,
    0,
  );
});
