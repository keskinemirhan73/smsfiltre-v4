import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeMessageLocally } from './localMessageAnalysis';

const database = {
  blacklistedNumbers: [],
  spamKeywords: ['bahis', 'bonus'],
  scamUrls: ['bit.ly'],
  regexPatterns: ['b[.\\s]*a[.\\s]*h[.\\s]*i[.\\s]*s'],
};

test('tehdit veritabanındaki alan adını yüksek risk olarak işaretler', () => {
  const result = analyzeMessageLocally('Hemen bit.ly/odul bağlantısına girin', database, 'tr');

  assert.equal(result.riskLevel, 'Yüksek');
  assert.equal(result.threatType, 'Şüpheli Bağlantı');
});

test('normal konuşmayı düşük risk olarak değerlendirir', () => {
  const result = analyzeMessageLocally('Merhaba, toplantı yarın saat 10.00’da.', database, 'tr');

  assert.equal(result.riskLevel, 'Düşük');
  assert.equal(result.threatType, 'Belirgin Tehdit Yok');
});

test('İngilizce arayüz için İngilizce sonuç üretir', () => {
  const result = analyzeMessageLocally('Claim your bonus now', database, 'en');

  assert.equal(result.riskLevel, 'High');
  assert.equal(result.threatType, 'Spam or Scam Pattern');
});
