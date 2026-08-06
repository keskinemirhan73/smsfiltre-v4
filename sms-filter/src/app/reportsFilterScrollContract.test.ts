import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const reportsScreen = readFileSync(
  resolve(projectRoot, 'src/screens/ReportsScreen.tsx'),
  'utf8',
);

test('rapor filtreleri dar ekranlarda yatay kaydırılabilir kalır', () => {
  assert.match(
    reportsScreen,
    /<ScrollView\s+horizontal\s+showsHorizontalScrollIndicator=\{false\}[\s\S]*?style=\{styles\.filterRow\}/,
  );
  assert.match(reportsScreen, /contentContainerStyle=\{styles\.filterContent\}/);
});
