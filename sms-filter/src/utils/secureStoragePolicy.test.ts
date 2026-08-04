import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { classifyStoredValue } from './secureStoragePolicy';

test('depolama zarflarini guvenli gecis icin ayirt eder', () => {
  assert.equal(classifyStoredValue('v2:abcd:ciphertext'), 'encrypted-v2');
  assert.equal(classifyStoredValue('plain:v1:{"secret":true}'), 'legacy-plain');
  assert.equal(classifyStoredValue('{"legacy":true}'), 'legacy-json');
  assert.equal(classifyStoredValue('U2FsdGVkX1...'), 'legacy-encrypted');
});

test('SecureStorage kripto hatasinda yeni veriyi duz metin yazmaz', () => {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const source = readFileSync(
    resolve(projectRoot, 'src/utils/SecureStorage.ts'),
    'utf8',
  );

  assert.doesNotMatch(source, /AsyncStorage\.setItem\(key, `\$\{PLAIN_FALLBACK_PREFIX\}/);
  assert.match(source, /throw new SecureStorageUnavailableError/);
  assert.match(source, /migrateLegacyPlaintext/);
});
