const { timingSafeEqual } = require('node:crypto');

function tokensMatch(actualToken, expectedToken) {
  const actual = Buffer.from(actualToken, 'utf8');
  const expected = Buffer.from(expectedToken, 'utf8');

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createAdminAuth(adminSecret) {
  return (req, res, next) => {
    if (!adminSecret) {
      return res.status(503).json({
        error: 'Yönetici erişimi sunucuda yapılandırılmamış.',
      });
    }

    const authorization = req.headers.authorization || '';
    const rawToken = authorization.replace(/^Bearer\s+/i, '').trim();
    // Split password and optional 2FA TOTP code
    const [sentPassword] = rawToken.split(':');

    if (!tokensMatch(sentPassword, adminSecret)) {
      return res.status(401).json({
        error: 'Yetkisiz erişim! Geçersiz kimlik bilgisi.',
      });
    }

    return next();
  };
}

module.exports = { createAdminAuth };
