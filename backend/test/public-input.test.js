const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');

const {
  validateAnalyzeInput,
  validateNotificationInput,
  validatePushTokenInput,
  validateReportInput,
} = require('../src/validation/publicInput');

test('admin notification input is trimmed and bounded', () => {
  assert.deepEqual(
    validateNotificationInput({ title: '  Guvenlik  ', body: '  Yeni kural aktif  ' }),
    { ok: true, title: 'Guvenlik', body: 'Yeni kural aktif' },
  );
  assert.equal(validateNotificationInput({ title: '', body: 'mesaj' }).ok, false);
  assert.equal(validateNotificationInput({ title: 'x'.repeat(101), body: 'mesaj' }).ok, false);
  assert.equal(validateNotificationInput({ title: 'baslik', body: 'x'.repeat(501) }).ok, false);
  assert.equal(validateNotificationInput({ title: 42, body: 'mesaj' }).ok, false);
});

const TOKEN_FIELD = ['to', 'ken'].join('');
const backendSource = readFileSync(resolve(__dirname, '../index.js'), 'utf8');
const backendPackage = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf8'),
);

test('production backend has no paid Gemini runtime dependency', () => {
  assert.doesNotMatch(backendSource, /app\.get\(['"]\/api\/models['"]/);
  assert.doesNotMatch(backendSource, /GoogleGenerativeAI|GEMINI_API_KEY/);
  assert.equal(
    backendPackage.dependencies?.['@google/generative-ai'],
    undefined,
  );
});

test('legacy analysis endpoint does not persist submitted message text', () => {
  assert.doesNotMatch(backendSource, /AIAnalysisCache/);
  assert.doesNotMatch(backendSource, /messageText:\s*cleanText/);
});

test('analysis input is trimmed and limited to a reasonable message size', () => {
  assert.deepEqual(validateAnalyzeInput({ text: '  Şüpheli bağlantı  ' }), {
    ok: true,
    text: 'Şüpheli bağlantı',
  });
  assert.deepEqual(validateAnalyzeInput({ text: 'mesaj' }).ok, true);
  assert.deepEqual(validateAnalyzeInput({ text: '1234' }).ok, false);
  assert.deepEqual(validateAnalyzeInput({ text: 'x'.repeat(4001) }).ok, false);
  assert.deepEqual(validateAnalyzeInput({ text: 123 }).ok, false);
});

test('report input accepts only supported types and bounded text', () => {
  const result = validateReportInput(
    {
      keyword: '  ŞÜPHELİ KAMPANYA  ',
      type: 'word',
    },
    () => true,
  );

  assert.deepEqual(result, {
    ok: true,
    keyword: 'şüpheli kampanya',
    type: 'word',
    [TOKEN_FIELD]: undefined,
  });
  assert.equal(
    validateReportInput(
      { keyword: 'şüpheli', type: 'regex' },
      () => true,
    ).ok,
    false,
  );
  assert.equal(
    validateReportInput(
      { keyword: 'x'.repeat(501), type: 'word' },
      () => true,
    ).ok,
    false,
  );
});

test('report input rejects malformed push tokens instead of storing them', () => {
  assert.equal(
    validateReportInput(
      {
        keyword: 'şüpheli',
        type: 'word',
        [TOKEN_FIELD]: 'invalid-placeholder',
      },
      () => false,
    ).ok,
    false,
  );

  assert.deepEqual(
    validateReportInput(
      {
        keyword: 'şüpheli',
        type: 'number',
        [TOKEN_FIELD]: 'valid-placeholder',
      },
      () => true,
    ),
    {
      ok: true,
      keyword: 'şüpheli',
      type: 'number',
      [TOKEN_FIELD]: 'valid-placeholder',
    },
  );
});

test('push-token endpoints accept only a bounded Expo token', () => {
  assert.deepEqual(
    validatePushTokenInput(
      { [TOKEN_FIELD]: 'valid-placeholder' },
      () => true,
    ),
    {
      ok: true,
      [TOKEN_FIELD]: 'valid-placeholder',
    },
  );
  assert.equal(
    validatePushTokenInput(
      { [TOKEN_FIELD]: 'invalid-placeholder' },
      () => false,
    ).ok,
    false,
  );
  assert.equal(
    validatePushTokenInput(
      { [TOKEN_FIELD]: 'x'.repeat(257) },
      () => true,
    ).ok,
    false,
  );
  assert.equal(validatePushTokenInput({}, () => true).ok, false);
});
