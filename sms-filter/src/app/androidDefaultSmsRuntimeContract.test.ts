import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const messagingTargets = resolve(projectRoot, 'targets/android-messaging');

test('Android varsayilan SMS native kaynak dosyalarinin tumu mevcuttur', () => {
  assert.equal(existsSync(resolve(messagingTargets, 'DefaultSmsRoleModule.kt')), true);
  assert.equal(existsSync(resolve(messagingTargets, 'DefaultSmsRolePackage.kt')), true);
  assert.equal(existsSync(resolve(messagingTargets, 'SmsDeliverReceiver.kt')), true);
  assert.equal(existsSync(resolve(messagingTargets, 'MmsDeliverReceiver.kt')), true);
  assert.equal(existsSync(resolve(messagingTargets, 'RespondViaMessageService.kt')), true);
});

test('SmsDeliverReceiver SMS govdesini saklamadan maskeli olay kuyrugu yazar', () => {
  const source = readFileSync(resolve(messagingTargets, 'SmsDeliverReceiver.kt'), 'utf8');

  assert.match(source, /class SmsDeliverReceiver : BroadcastReceiver/);
  assert.match(source, /Telephony\.Sms\.Intents\.SMS_DELIVER_ACTION/);
  assert.match(source, /smsfilter_event_queue_json/);
  assert.match(source, /recordSmsEvent\(/);
  assert.match(source, /maskSender\(/);
  assert.doesNotMatch(source, /put\("body"/);
  assert.doesNotMatch(source, /Log\.d\([^\n]*\$body/);
});

test('MmsDeliverReceiver WAP_PUSH_DELIVER_ACTION yayinini karsilar', () => {
  const source = readFileSync(resolve(messagingTargets, 'MmsDeliverReceiver.kt'), 'utf8');

  assert.match(source, /class MmsDeliverReceiver : BroadcastReceiver/);
  assert.match(source, /Telephony\.Sms\.Intents\.WAP_PUSH_DELIVER_ACTION/);
});

test('RespondViaMessageService ACTION_RESPOND_VIA_MESSAGE servisini sunar', () => {
  const source = readFileSync(resolve(messagingTargets, 'RespondViaMessageService.kt'), 'utf8');

  assert.match(source, /class RespondViaMessageService : Service/);
  assert.match(source, /Intent\.ACTION_RESPOND_VIA_MESSAGE/);
});

test('withAndroidSmsFilter varsayilan SMS kopyalama adiminda tum 5 native dosyayi tasir', () => {
  const pluginSource = readFileSync(resolve(projectRoot, 'plugins/withAndroidSmsFilter.js'), 'utf8');

  assert.match(pluginSource, /DefaultSmsRoleModule\.kt/);
  assert.match(pluginSource, /DefaultSmsRolePackage\.kt/);
  assert.match(pluginSource, /SmsDeliverReceiver\.kt/);
  assert.match(pluginSource, /MmsDeliverReceiver\.kt/);
  assert.match(pluginSource, /RespondViaMessageService\.kt/);
});
