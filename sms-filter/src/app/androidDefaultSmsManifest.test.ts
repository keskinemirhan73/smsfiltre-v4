import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { applyDefaultSmsManifest } = require('../../plugins/withAndroidSmsFilter.js');

function createManifestFixture() {
  return {
    manifest: {
      'uses-permission': [{
        $: { 'android:name': 'android.permission.INTERNET' },
      }],
      'uses-feature': [],
      application: [{
        $: { 'android:name': '.MainApplication' },
        activity: [{
          $: {
            'android:name': '.MainActivity',
            'android:exported': 'true',
          },
        }],
        receiver: [{
          $: {
            'android:name': '.SmsFilterReceiver',
            'android:exported': 'true',
          },
        }],
      }],
    },
  };
}

interface ManifestIntentFilter {
  action: Array<{ $: Record<string, string> }>;
  data?: Array<{ $: Record<string, string> }>;
}

interface ManifestComponent {
  $: Record<string, string>;
  'intent-filter'?: ManifestIntentFilter[];
}

function componentByName(components: ManifestComponent[], name: string) {
  return components.find(component => component.$['android:name'] === name);
}

test('varsayilan SMS manifesti gerekli izinleri ekler ve Call Log istemez', () => {
  const input = createManifestFixture();
  const output = applyDefaultSmsManifest(input);
  const permissions = output.manifest['uses-permission'].map(
    (entry: { $: Record<string, string> }) => entry.$['android:name'],
  );

  assert.deepEqual(permissions.sort(), [
    'android.permission.INTERNET',
    'android.permission.READ_SMS',
    'android.permission.RECEIVE_MMS',
    'android.permission.RECEIVE_SMS',
    'android.permission.RECEIVE_WAP_PUSH',
    'android.permission.SEND_SMS',
  ].sort());
  assert.equal(permissions.some((permission: string) => permission.includes('CALL_LOG')), false);
  assert.equal(input.manifest['uses-permission'].length, 1);
});

test('SMS ve MMS teslim alicilari sistem izinleriyle korunur', () => {
  const output = applyDefaultSmsManifest(createManifestFixture());
  const application = output.manifest.application[0];
  const smsReceiver = componentByName(application.receiver, '.SmsDeliverReceiver');
  const mmsReceiver = componentByName(application.receiver, '.MmsDeliverReceiver');

  assert.ok(smsReceiver?.['intent-filter']);
  assert.ok(mmsReceiver?.['intent-filter']);
  assert.ok(mmsReceiver['intent-filter'][0].data);

  assert.equal(smsReceiver?.$['android:permission'], 'android.permission.BROADCAST_SMS');
  assert.equal(smsReceiver?.$['android:exported'], 'true');
  assert.equal(
    smsReceiver?.['intent-filter'][0].action[0].$['android:name'],
    'android.provider.Telephony.SMS_DELIVER',
  );

  assert.equal(mmsReceiver?.$['android:permission'], 'android.permission.BROADCAST_WAP_PUSH');
  assert.equal(
    mmsReceiver?.['intent-filter'][0].action[0].$['android:name'],
    'android.provider.Telephony.WAP_PUSH_DELIVER',
  );
  assert.equal(
    mmsReceiver['intent-filter'][0].data[0].$['android:mimeType'],
    'application/vnd.wap.mms-message',
  );
});

test('SENDTO aktivitesi ve RESPOND_VIA_MESSAGE servisi tum mesaj semalarini destekler', () => {
  const output = applyDefaultSmsManifest(createManifestFixture());
  const application = output.manifest.application[0];
  const mainActivity = componentByName(application.activity, '.MainActivity');
  const respondService = componentByName(application.service, '.RespondViaMessageService');

  assert.ok(mainActivity?.['intent-filter']);
  assert.ok(respondService?.['intent-filter']);

  const activityFilter = mainActivity?.['intent-filter'].find(
    (filter: { action: Array<{ $: Record<string, string> }> }) =>
      filter.action.some(action => action.$['android:name'] === 'android.intent.action.SENDTO'),
  );
  assert.ok(activityFilter?.data);
  assert.ok(respondService['intent-filter'][0].data);

  const activitySchemes = activityFilter.data.map(
    (entry: { $: Record<string, string> }) => entry.$['android:scheme'],
  );

  assert.deepEqual(activitySchemes, ['sms', 'smsto', 'mms', 'mmsto']);
  assert.equal(
    respondService?.$['android:permission'],
    'android.permission.SEND_RESPOND_VIA_MESSAGE',
  );
  assert.deepEqual(
    respondService['intent-filter'][0].data.map(
      (entry: { $: Record<string, string> }) => entry.$['android:scheme'],
    ),
    ['sms', 'smsto', 'mms', 'mmsto'],
  );
});

test('varsayilan SMS modu eski SMS_RECEIVED alicisini kaldirir ve idempotenttir', () => {
  const once = applyDefaultSmsManifest(createManifestFixture());
  const twice = applyDefaultSmsManifest(once);
  const receiverNames = twice.manifest.application[0].receiver.map(
    (entry: { $: Record<string, string> }) => entry.$['android:name'],
  );

  assert.equal(receiverNames.includes('.SmsFilterReceiver'), false);
  assert.equal(receiverNames.filter((name: string) => name === '.SmsDeliverReceiver').length, 1);
  assert.equal(receiverNames.filter((name: string) => name === '.MmsDeliverReceiver').length, 1);
});
