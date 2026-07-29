const test = require('node:test');
const assert = require('node:assert/strict');

const {
  analyzeMessage,
  isReportEligible,
} = require('../src/services/messageAnalysis');

test('ordinary conversational messages stay low risk', () => {
  assert.deepEqual(
    analyzeMessage('Merhaba, yarın saat 10:00 toplantımız var.'),
    {
      riskLevel: 'Düşük',
      threatType: 'Belirgin tehdit işareti bulunamadı',
      recommendation:
        'Yine de tanımadığınız göndericilerden gelen bağlantı ve taleplere dikkat edin.',
      signals: [],
    },
  );
});

test('gambling promotions are classified as high risk', () => {
  const result = analyzeMessage(
    'CASINO bonusu kazandınız! Bahis için hemen üyelik açın.',
  );

  assert.equal(result.riskLevel, 'Yüksek');
  assert.equal(result.threatType, 'Yasa dışı bahis veya kumar reklamı');
  assert.ok(result.signals.includes('gambling'));
});

test('credential theft links are classified as very high risk', () => {
  const result = analyzeMessage(
    'Banka hesabınız askıya alındı. Şifrenizi doğrulamak için hemen https://bit.ly/ornek bağlantısına girin.',
  );

  assert.equal(result.riskLevel, 'Çok Yüksek');
  assert.equal(result.threatType, 'Oltalama ve hesap ele geçirme riski');
  assert.ok(result.signals.includes('link'));
  assert.ok(result.signals.includes('credential'));
  assert.ok(result.signals.includes('urgency'));
});

test('a routine one-time-password message without a link is not overblocked', () => {
  const result = analyzeMessage(
    'Giriş doğrulama kodunuz 482913. Bu kodu kimseyle paylaşmayın.',
  );

  assert.equal(result.riskLevel, 'Orta');
  assert.equal(result.threatType, 'Doğrulama kodu içeren mesaj');
});

test('obfuscated gambling words are still detected', () => {
  const result = analyzeMessage(
    'C.A.S.I.N.O fırsatı ve b-a-h-i-s bonusu seni bekliyor.',
  );

  assert.equal(result.riskLevel, 'Yüksek');
  assert.ok(result.signals.includes('gambling'));
});

test('report eligibility rejects ordinary phrases but accepts risky content', () => {
  assert.equal(isReportEligible('merhaba nasılsın'), false);
  assert.equal(isReportEligible('casino bonus fırsatı'), true);
  assert.equal(
    isReportEligible('hesabınız kapanacak https://bit.ly/ornek'),
    true,
  );
});
