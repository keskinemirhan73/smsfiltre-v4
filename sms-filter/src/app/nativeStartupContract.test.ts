import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('uygulama acilisinda native filtre yapilandirmasi hazirlanir', () => {
  const appSource = readFileSync(resolve(projectRoot, 'App.tsx'), 'utf8');
  assert.match(appSource, /FilterManager\.initializeNativeFiltering\(\)/);
});

test('bulut senkronizasyonundan sonra native tehdit kurallari yenilenir', () => {
  const syncSource = readFileSync(
    resolve(projectRoot, 'src/services/BackgroundSyncService.ts'),
    'utf8',
  );
  assert.match(syncSource, /FilterManager\.initializeNativeFiltering\(\)/);
});
