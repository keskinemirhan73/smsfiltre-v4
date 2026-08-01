import assert from 'node:assert/strict';
import test from 'node:test';

import { SecurityUtils } from './SecurityUtils';

test('ülke kodundan sonra boşluk bulunan telefon numarasını tamamen maskeler', () => {
  const masked = SecurityUtils.maskPII('Beni +90 555 123 45 67 numarasından ara');

  assert.equal(masked, 'Beni [TELEFON_GİZLENDİ] numarasından ara');
});

test('e-posta ve doğrulama kodunu maskeler', () => {
  const masked = SecurityUtils.maskPII('test@example.com için kod 483921');

  assert.equal(masked, '[E-POSTA_GİZLENDİ] için kod [DOĞRULAMA_KODU_GİZLENDİ]');
});

test('URL çıkarırken kapanış noktalamasını bağlantıya katmaz', () => {
  assert.deepEqual(
    SecurityUtils.extractUrls('Şuraya bak: https://example.com/path.'),
    ['https://example.com/path'],
  );
});
