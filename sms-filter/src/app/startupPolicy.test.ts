import assert from 'node:assert/strict';
import test from 'node:test';

import { getInitialRoute } from './startupPolicy';

test('ilk açılışta izin açıklamasını gösterir', () => {
  assert.equal(getInitialRoute(false), 'Onboarding');
});

test('onboarding tamamlandıysa ana ekrana gider', () => {
  assert.equal(getInitialRoute(true), 'MainTabs');
});
