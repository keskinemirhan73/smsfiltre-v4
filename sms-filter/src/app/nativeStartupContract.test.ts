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

test('eşzamanlı native olay içe aktarımları tek işlemde birleştirilir', () => {
  const managerSource = readFileSync(
    resolve(projectRoot, 'src/modules/FilterManager.ts'),
    'utf8',
  );
  assert.match(managerSource, /nativeImportInFlight/);
  assert.match(managerSource, /performNativeSmsEventImport/);
  assert.match(managerSource, /storageMutationQueue/);
  assert.match(managerSource, /withStorageMutation/);
  assert.match(managerSource, /smsfilter_pending_sender_override_ids_json/);
  assert.match(managerSource, /mergePendingSenderCorrections/);
  assert.match(managerSource, /loadPendingSenderCorrections/);
});

test('uygulama indeks dışında kalan bekleyen gönderici kayıtlarını da bulup temizler', () => {
  const managerSource = readFileSync(
    resolve(projectRoot, 'src/modules/FilterManager.ts'),
    'utf8',
  );
  const appleTargetsPatch = readFileSync(
    resolve(projectRoot, 'patches/@bacons+apple-targets+4.0.7.patch'),
    'utf8',
  );

  assert.match(managerSource, /getKeys\(/);
  assert.match(managerSource, /NATIVE_PENDING_SENDER_OVERRIDE_KEY_PREFIX\}pending-/);
  assert.match(managerSource, /pendingKeysToRemove\.forEach/);
  assert.match(appleTargetsPatch, /dictionaryRepresentation\(\)/);
  assert.match(appleTargetsPatch, /getKeys/);
});
