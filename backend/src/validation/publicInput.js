const ANALYSIS_TEXT_MIN_LENGTH = 5;
const ANALYSIS_TEXT_MAX_LENGTH = 4000;
const REPORT_TEXT_MIN_LENGTH = 3;
const REPORT_TEXT_MAX_LENGTH = 500;
const PUSH_TOKEN_MAX_LENGTH = 256;
const REPORT_TYPES = new Set(['word', 'number']);

function invalid(error) {
  return { ok: false, error };
}

function validateAnalyzeInput(body) {
  if (!body || typeof body !== 'object' || typeof body.text !== 'string') {
    return invalid('Lütfen analiz edilecek geçerli bir metin girin.');
  }

  const text = body.text.trim();
  if (
    text.length < ANALYSIS_TEXT_MIN_LENGTH ||
    text.length > ANALYSIS_TEXT_MAX_LENGTH
  ) {
    return invalid(
      `Analiz metni ${ANALYSIS_TEXT_MIN_LENGTH}-${ANALYSIS_TEXT_MAX_LENGTH} karakter arasında olmalıdır.`,
    );
  }

  return { ok: true, text };
}

function validateReportInput(body, isValidPushToken) {
  if (!body || typeof body !== 'object' || typeof body.keyword !== 'string') {
    return invalid('Lütfen geçerli bir bildirim metni girin.');
  }

  const keyword = body.keyword.trim().toLocaleLowerCase('tr-TR');
  if (
    keyword.length < REPORT_TEXT_MIN_LENGTH ||
    keyword.length > REPORT_TEXT_MAX_LENGTH
  ) {
    return invalid(
      `Bildirim metni ${REPORT_TEXT_MIN_LENGTH}-${REPORT_TEXT_MAX_LENGTH} karakter arasında olmalıdır.`,
    );
  }

  const type = body.type ?? 'word';
  if (!REPORT_TYPES.has(type)) {
    return invalid('Geçersiz bildirim türü.');
  }

  const rawToken = body.token;
  if (rawToken === undefined || rawToken === null || rawToken === '') {
    return { ok: true, keyword, type, token: undefined };
  }

  if (
    typeof rawToken !== 'string' ||
    rawToken.length > PUSH_TOKEN_MAX_LENGTH ||
    !isValidPushToken(rawToken)
  ) {
    return invalid('Geçersiz bildirim tokenı.');
  }

  return { ok: true, keyword, type, token: rawToken };
}

function validatePushTokenInput(body, isValidPushToken) {
  if (
    !body ||
    typeof body !== 'object' ||
    typeof body.token !== 'string' ||
    body.token.length === 0 ||
    body.token.length > PUSH_TOKEN_MAX_LENGTH ||
    !isValidPushToken(body.token)
  ) {
    return invalid('Geçersiz bildirim tokenı.');
  }

  return { ok: true, token: body.token };
}

module.exports = {
  validateAnalyzeInput,
  validatePushTokenInput,
  validateReportInput,
};
