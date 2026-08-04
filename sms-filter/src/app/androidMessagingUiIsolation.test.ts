import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const screensRoot = resolve(projectRoot, 'src/features/messaging/screens');

test('varsayilan SMS ekranlari yalniz Android girisinden disari acilir', () => {
  assert.equal(existsSync(resolve(screensRoot, 'index.android.ts')), true);
  assert.equal(existsSync(resolve(screensRoot, 'index.ios.ts')), true);
  assert.match(readFileSync(resolve(screensRoot, 'index.android.ts'), 'utf8'), /InboxScreen/);
  assert.doesNotMatch(readFileSync(resolve(screensRoot, 'index.ios.ts'), 'utf8'), /InboxScreen|ComposeScreen|ROLE_SMS/);
  assert.doesNotMatch(readFileSync(resolve(screensRoot, 'index.ts'), 'utf8'), /InboxScreen|ComposeScreen|ROLE_SMS/);
});
