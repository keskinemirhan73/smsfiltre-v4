import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const extensionSource = readFileSync(
  resolve(projectRoot, 'targets/message-filter/MessageFilterExtension.swift'),
  'utf8',
);

test('iOS filtre uzantisi analiz girdilerini sinirlar', () => {
  assert.match(extensionSource, /prefix\(4096\)/);
  assert.match(extensionSource, /prefix\(256\)/);
  assert.match(extensionSource, /keyword\.count <= 160/);
});

test('iOS beyaz liste yalniz tam gonderici eslesmesine izin verir', () => {
  assert.match(extensionSource, /sender\.compare\(value, options: \.caseInsensitive\) == \.orderedSame/);
  assert.doesNotMatch(extensionSource, /sender\.range\(of: value/);
});

test('iOS filtre uzantisi mesajlari aga gondermez veya loglamaz', () => {
  assert.doesNotMatch(extensionSource, /URLSession|Network|fetch\(|print\(|NSLog/);
});

test('iOS filtre olay kuyruğu extension kapanmadan kalıcı App Group verisine yazılır', () => {
  assert.match(extensionSource, /"source":\s*"filter"/);
  assert.match(extensionSource, /defaults\.set\(outputData, forKey: "smsfilter_event_queue_json"\)/);
  assert.match(extensionSource, /defaults\.synchronize\(\)/);
});

test('iOS filtre uzantısı yalnız uygulamada onaylanmış kuralları kullanır', () => {
  assert.doesNotMatch(extensionSource, /smsfilter_pending_sender_override/);
  assert.doesNotMatch(extensionSource, /smsfilter_report_sender_override/);
});
