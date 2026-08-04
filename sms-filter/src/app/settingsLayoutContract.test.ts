import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const settingsSource = readFileSync(
  resolve(projectRoot, 'src/screens/SettingsScreen.tsx'),
  'utf8',
);

test('gorunum secicileri dar ekranda etiketleri sikistirmayan dikey duzen kullanir', () => {
  assert.match(settingsSource, /appearanceSelectorRow/);
  assert.match(settingsSource, /appearanceSelectorHeader/);
  assert.match(settingsSource, /appearanceSelectorOptions/);
  assert.match(settingsSource, /appearanceOption/);
});
