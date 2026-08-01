import assert from 'node:assert/strict';
import test from 'node:test';

import { createPublicJsonRequest } from './publicApiRequest';

test('halka açık mobil API çağrısı gizli veya sahte yetkilendirme başlığı göndermez', () => {
  const request = createPublicJsonRequest({ text: 'örnek' });

  assert.deepEqual(request.headers, { 'Content-Type': 'application/json' });
  assert.equal('Authorization' in request.headers, false);
  assert.equal(request.body, JSON.stringify({ text: 'örnek' }));
});
