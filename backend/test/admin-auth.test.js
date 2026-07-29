const assert = require('node:assert/strict');
const test = require('node:test');

const { createAdminAuth } = require('../src/middleware/adminAuth');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('admin endpoints fail closed when no secret is configured', () => {
  const middleware = createAdminAuth(undefined);
  const response = createResponse();
  let nextCalled = false;

  middleware({ headers: {} }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 503);
  assert.equal(nextCalled, false);
});

test('admin endpoints reject an invalid bearer token', () => {
  const middleware = createAdminAuth('a-long-random-secret');
  const response = createResponse();
  let nextCalled = false;

  middleware(
    { headers: { authorization: 'Bearer wrong-secret' } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('admin endpoints accept the configured bearer token', () => {
  const middleware = createAdminAuth('a-long-random-secret');
  const response = createResponse();
  let nextCalled = false;

  middleware(
    { headers: { authorization: 'Bearer a-long-random-secret' } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
});
