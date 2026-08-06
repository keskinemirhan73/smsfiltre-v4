import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('reports exist only in the main tab and render imported native activity', () => {
  const appSource = readFileSync(resolve(projectRoot, 'App.tsx'), 'utf8');
  const reportsSource = readFileSync(resolve(projectRoot, 'src/screens/ReportsScreen.tsx'), 'utf8');
  const rulesSource = readFileSync(resolve(projectRoot, 'src/screens/RulesScreen.tsx'), 'utf8');

  assert.match(appSource, /name="Raporlar"/);
  assert.match(reportsSource, /FilterManager\.importNativeSmsEvents\(\)/);
  assert.match(reportsSource, /filteredEvents\.map/);
  assert.match(reportsSource, /event\.timestamp/);
  assert.match(reportsSource, /maxLength=\{200\}/);
  assert.doesNotMatch(reportsSource, /parsed\s*\?\s*parsed\.keyword\s*:\s*reportInput\.trim\(\)/);
  assert.match(reportsSource, /SMS İşlem Geçmişi/);
  assert.doesNotMatch(reportsSource, /Apple Mesajlar İşlemleri/);
  assert.doesNotMatch(rulesSource, /key:\s*['"]reports['"]/);
  assert.doesNotMatch(rulesSource, /Raporlar\s*&/);
  assert.doesNotMatch(rulesSource, /activeTab\s*===\s*['"]reports['"]/);
});
