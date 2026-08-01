import assert from 'node:assert/strict';
import test from 'node:test';

import { backgroundSyncOutcome } from './backgroundSyncPolicy';

test('başarılı güncellemeyi yeni veri olarak işaretler', () => {
  assert.equal(backgroundSyncOutcome(true), 'new-data');
});

test('başarısız güncellemeyi başarı gibi raporlamaz', () => {
  assert.equal(backgroundSyncOutcome(false), 'failed');
});
