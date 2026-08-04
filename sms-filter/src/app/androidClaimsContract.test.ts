import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Android arayuzu teslim engelleme yerine tespit dilini kullanir', () => {
  const settingsSource = readFileSync(
    resolve(projectRoot, 'src/screens/SettingsScreen.tsx'),
    'utf8',
  );
  const simulatorSource = readFileSync(
    resolve(projectRoot, 'src/screens/TestSimulatorScreen.tsx'),
    'utf8',
  );
  const translations = readFileSync(resolve(projectRoot, 'src/i18n.ts'), 'utf8');

  assert.doesNotMatch(settingsSource, /Blocks only when absolutely sure/);
  assert.doesNotMatch(settingsSource, /Blocks every message/);
  assert.doesNotMatch(settingsSource, /Şüpheli bulduğu her mesajı engeller/);
  assert.doesNotMatch(settingsSource, /Yurtdışı Numaralarını Engelle/);
  assert.doesNotMatch(simulatorSource, /Engellendi \(Spam\)/);
  assert.doesNotMatch(translations, /numberBlock: 'Numara Engeli'/);
  assert.doesNotMatch(translations, /wordBlock: 'Kelime Engeli'/);
});

test('Google Play aciklamasi Android sinirini acikca belirtir', () => {
  const listing = JSON.parse(readFileSync(
    resolve(projectRoot, 'store-assets/google-play/listing-tr.json'),
    'utf8',
  ));
  assert.match(listing.fullDescription, /mesajları cihazın Mesajlar uygulamasından silmez/i);
  assert.match(listing.fullDescription, /teslim edilmesini engellemez/i);
});
