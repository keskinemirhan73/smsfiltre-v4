const test = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../index');

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('POST /api/analyze returns a deterministic rules-engine result', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'Hesabınız askıya alındı, hemen https://bit.ly/ornek adresinden şifrenizi doğrulayın.',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.analysisEngine, 'rules-v1');
    assert.equal(body.riskLevel, 'Çok Yüksek');
    assert.equal(body.isFallback, undefined);
  });
});

test('POST /api/analyze rejects malformed input', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'a' }),
    });

    assert.equal(response.status, 400);
  });
});
