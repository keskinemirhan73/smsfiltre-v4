import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('TypeScript sınıflandırıcı manuel gönderici kategori politikasını kullanır', () => {
  const manager = readFileSync(resolve(projectRoot, 'src/modules/FilterManager.ts'), 'utf8');
  assert.match(manager, /resolveUserRuleCategory\(/);
  assert.match(manager, /FilterManager\.categorizeSender|static (?:async )?categorizeSender/);
  assert.ok(
    manager.indexOf('const exactSenderOverride') < manager.indexOf('const isForeignSender'),
    'Kesin gönderen tercihi yabancı numara sezgisinden önce uygulanmalı.',
  );
});

test('iOS kesin gönderici işlem ve tanıtım kurallarını genel filtre anahtarlarından bağımsız uygular', () => {
  const source = readFileSync(
    resolve(projectRoot, 'targets/message-filter/MessageFilterExtension.swift'),
    'utf8',
  );
  assert.match(source, /category == "transaction" && matchMode != "exact" && !filterTransactions/);
  assert.match(source, /category == "promotion" && matchMode != "exact" && !filterPromotions/);
  assert.match(source, /let exactSenderOverride = findExactSenderOverrideCategory/);
  assert.ok(
    source.indexOf('let exactSenderOverride') < source.indexOf('let isWhitelisted'),
    'iOS exact sender preference must run before the whitelist.',
  );
  assert.ok(
    source.indexOf('let exactSenderOverride') < source.indexOf('let isForeignSender'),
    'iOS exact sender preference must run before risk heuristics.',
  );
});

test('kesin gönderen kuralları TypeScript, Swift ve Kotlin katmanlarında eşitlik kullanır', () => {
  const manager = readFileSync(resolve(projectRoot, 'src/modules/FilterManager.ts'), 'utf8');
  const swift = readFileSync(resolve(projectRoot, 'targets/message-filter/MessageFilterExtension.swift'), 'utf8');
  const androidFilter = readFileSync(resolve(projectRoot, 'targets/android-filter/SmsFilterReceiver.kt'), 'utf8');
  const androidMessaging = readFileSync(resolve(projectRoot, 'targets/android-messaging/SmsDeliverReceiver.kt'), 'utf8');
  assert.match(manager, /senderRuleMatches\(sender, rule\.keyword\)/);
  assert.match(swift, /matchTarget == "sender" && matchMode == "exact"[\s\S]*?compare\(keyword[\s\S]*?== \.orderedSame/);
  assert.match(androidFilter, /matchTarget == "sender" && matchMode == "exact"[\s\S]*?sender\.trim\(\)\.equals\(keyword\.trim\(\), ignoreCase = true\)/);
  assert.match(androidMessaging, /matchTarget == "sender" && matchMode == "exact"[\s\S]*?sender\.trim\(\)\.equals\(keyword\.trim\(\), ignoreCase = true\)/);
});

test('maskeli native geçmişten çalışmayacak gönderen kuralı kaydedilmez', () => {
  const detail = readFileSync(resolve(projectRoot, 'src/components/SmsDetailModal.tsx'), 'utf8');
  assert.match(detail, /item\.source !== 'native'/);
  assert.match(detail, /!item\.sender\.includes\('\*'\)/);
  assert.match(detail, /Raporlar ekranından gerçek gönderen adını/);
});
