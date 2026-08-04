import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MIN_BRAND_SPLASH_DURATION_MS,
  getRemainingSplashDuration,
} from './splashPolicy';

test('markali giris ekrani en az belirlenen sure boyunca gorunur', () => {
  assert.equal(MIN_BRAND_SPLASH_DURATION_MS, 1800);
  assert.equal(getRemainingSplashDuration(1_000, 1_600), 1_200);
});

test('minimum sure dolduysa giris ekranini bekletmez', () => {
  assert.equal(getRemainingSplashDuration(1_000, 3_000), 0);
});

test('saat geri giderse tam minimum sureyi uygular', () => {
  assert.equal(getRemainingSplashDuration(2_000, 1_500), 1_800);
});
