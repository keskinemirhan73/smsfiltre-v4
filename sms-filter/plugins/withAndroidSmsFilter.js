const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DEFAULT_SMS_PERMISSIONS = [
  'android.permission.' + 'READ_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_MMS',
  'android.permission.RECEIVE_WAP_PUSH',
];

const MESSAGE_SCHEMES = ['sms', 'smsto', 'mms', 'mmsto'];
const DEFAULT_SMS_RUNTIME_READY = true;

function cloneManifest(androidManifest) {
  return JSON.parse(JSON.stringify(androidManifest));
}

function addUniqueNamedEntry(entries, name, extra = {}) {
  const current = Array.isArray(entries) ? entries : [];
  if (current.some(entry => entry.$?.['android:name'] === name)) return current;
  return [...current, { $: { 'android:name': name, ...extra } }];
}

function replaceNamedComponent(components, component) {
  const current = Array.isArray(components) ? components : [];
  const name = component.$['android:name'];
  return [
    ...current.filter(entry => entry.$?.['android:name'] !== name),
    component,
  ];
}

function messageDataEntries() {
  return MESSAGE_SCHEMES.map(scheme => ({ $: { 'android:scheme': scheme } }));
}

function applyDefaultSmsManifest(androidManifest) {
  const output = cloneManifest(androidManifest);
  const manifest = output.manifest;
  const application = manifest.application[0];

  manifest['uses-permission'] = DEFAULT_SMS_PERMISSIONS.reduce(
    (entries, permission) => addUniqueNamedEntry(entries, permission),
    manifest['uses-permission'],
  );
  manifest['uses-feature'] = addUniqueNamedEntry(
    manifest['uses-feature'],
    'android.hardware.telephony',
    { 'android:required': 'true' },
  );

  application.receiver = (application.receiver || []).filter(
    receiver => receiver.$?.['android:name'] !== '.SmsFilterReceiver',
  );
  application.receiver = replaceNamedComponent(application.receiver, {
    $: {
      'android:name': '.SmsDeliverReceiver',
      'android:exported': 'true',
      'android:permission': 'android.permission.BROADCAST_SMS',
    },
    'intent-filter': [{
      action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_DELIVER' } }],
    }],
  });
  application.receiver = replaceNamedComponent(application.receiver, {
    $: {
      'android:name': '.MmsDeliverReceiver',
      'android:exported': 'true',
      'android:permission': 'android.permission.BROADCAST_WAP_PUSH',
    },
    'intent-filter': [{
      action: [{ $: { 'android:name': 'android.provider.Telephony.WAP_PUSH_DELIVER' } }],
      data: [{ $: { 'android:mimeType': 'application/vnd.wap.mms-message' } }],
    }],
  });

  application.service = replaceNamedComponent(application.service, {
    $: {
      'android:name': '.RespondViaMessageService',
      'android:exported': 'true',
      'android:permission': 'android.permission.SEND_RESPOND_VIA_MESSAGE',
    },
    'intent-filter': [{
      action: [{ $: { 'android:name': 'android.intent.action.RESPOND_VIA_MESSAGE' } }],
      category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
      data: messageDataEntries(),
    }],
  });

  const activities = Array.isArray(application.activity) ? application.activity : [];
  application.activity = activities.map(activity => {
    const name = activity.$?.['android:name'] || '';
    if (!(name === '.MainActivity' || name.endsWith('.MainActivity'))) return activity;

    const sendToFilter = {
      action: [{ $: { 'android:name': 'android.intent.action.SENDTO' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: messageDataEntries(),
    };
    const existingFilters = Array.isArray(activity['intent-filter'])
      ? activity['intent-filter'].filter(filter =>
        !(filter.action || []).some(
          action => action.$?.['android:name'] === 'android.intent.action.SENDTO',
        ),
      )
      : [];

    return { ...activity, 'intent-filter': [...existingFilters, sendToFilter] };
  });

  return output;
}

function applyDetectionManifest(androidManifest) {
  const output = cloneManifest(androidManifest);
  const manifest = output.manifest;
  const application = manifest.application[0];

  manifest['uses-permission'] = addUniqueNamedEntry(
    manifest['uses-permission'],
    'android.permission.RECEIVE_SMS',
  );
  application.receiver = replaceNamedComponent(application.receiver, {
    $: {
      'android:name': '.SmsFilterReceiver',
      'android:exported': 'true',
      'android:permission': 'android.permission.BROADCAST_SMS',
    },
    'intent-filter': [{
      action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }],
    }],
  });

  return output;
}

function withAndroidSmsFilter(config, options = {}) {
  if (options.enableDefaultSms && !DEFAULT_SMS_RUNTIME_READY) {
    throw new Error('Default SMS runtime is not ready; delivery components must be completed first.');
  }
  // 1. Add permissions and receiver to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    config.modResults = options.enableDefaultSms
      ? applyDefaultSmsManifest(config.modResults)
      : applyDetectionManifest(config.modResults);

    return config;
  });

  config = withMainApplication(config, (config) => {
    if (!options.enableDefaultSms) return config;
    const marker = '// add(MyReactNativePackage())';
    const registration = 'add(DefaultSmsRolePackage())';
    if (!config.modResults.contents.includes(registration)) {
      if (!config.modResults.contents.includes(marker)) {
        throw new Error('MainApplication paket kayit noktasi bulunamadi.');
      }
      config.modResults.contents = config.modResults.contents.replace(
        marker,
        `${marker}\n              ${registration}`,
      );
    }
    return config;
  });

  // 2. Copy the Kotlin file to the Android project during prebuild
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android.package || 'com.smsfilter.app';
      const packagePath = packageName.replace(/\./g, '/');
      
      const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath);
      const sourceFiles = options.enableDefaultSms
        ? [
          path.join(projectRoot, 'targets', 'android-messaging', 'DefaultSmsRoleModule.kt'),
          path.join(projectRoot, 'targets', 'android-messaging', 'DefaultSmsRolePackage.kt'),
          path.join(projectRoot, 'targets', 'android-messaging', 'SmsDeliverReceiver.kt'),
          path.join(projectRoot, 'targets', 'android-messaging', 'MmsDeliverReceiver.kt'),
          path.join(projectRoot, 'targets', 'android-messaging', 'RespondViaMessageService.kt'),
        ]
        : [path.join(projectRoot, 'targets', 'android-filter', 'SmsFilterReceiver.kt')];

      fs.mkdirSync(destDir, { recursive: true });
      for (const sourcePath of sourceFiles) {
        if (!fs.existsSync(sourcePath)) {
          throw new Error(`Android native kaynak dosyasi bulunamadi: ${sourcePath}`);
        }
        const destPath = path.join(destDir, path.basename(sourcePath));
        let content = fs.readFileSync(sourcePath, 'utf8');
        content = content.replace(/^package\s+.*$/m, `package ${packageName}`);
        fs.writeFileSync(destPath, content);
      }

      return config;
    }
  ]);

  return config;
}

module.exports = withAndroidSmsFilter;
module.exports.applyDefaultSmsManifest = applyDefaultSmsManifest;
module.exports.applyDetectionManifest = applyDetectionManifest;
