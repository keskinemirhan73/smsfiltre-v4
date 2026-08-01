import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSameLocalDay,
  parseThreatDatabase,
} from './threatCloudPolicy';

test('aynı gün kontrolünde yıl da karşılaştırılır', () => {
  const previousYear = new Date(2025, 7, 1, 10, 0);
  const currentYear = new Date(2026, 7, 1, 12, 0);

  assert.equal(isSameLocalDay(previousYear, currentYear), false);
});

test('geçerli tehdit veritabanını kabul eder', () => {
  const database = {
    blacklistedNumbers: ['+905551234567'],
    spamKeywords: ['bahis'],
    scamUrls: ['example.test'],
    regexPatterns: ['b.*a.*h.*i.*s'],
  };

  assert.deepEqual(parseThreatDatabase(database), database);
});

test('eksik veya yanlış türde tehdit veritabanını reddeder', () => {
  assert.throws(
    () => parseThreatDatabase({ spamKeywords: 'bahis' }),
    /Geçersiz tehdit veritabanı/,
  );
});

test('aşırı büyük veya geri izleme riski taşıyan tehdit kurallarını reddeder', () => {
  const base = {
    blacklistedNumbers: [],
    spamKeywords: [],
    scamUrls: [],
    regexPatterns: [],
  };

  assert.throws(
    () => parseThreatDatabase({ ...base, regexPatterns: ['(a+)+$'] }),
    /Geçersiz tehdit veritabanı/,
  );
  assert.throws(
    () => parseThreatDatabase({ ...base, spamKeywords: Array(1001).fill('x') }),
    /Geçersiz tehdit veritabanı/,
  );
});
