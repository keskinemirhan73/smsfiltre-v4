const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAndroidSmsFilter(config) {
  // 1. Add permissions and receiver to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add permissions
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    const permissions = [
      'android.permission.RECEIVE_SMS',
      'android.permission.READ_SMS'
    ];
    
    permissions.forEach(permission => {
      const exists = androidManifest.manifest['uses-permission'].some(
        (p) => p.$['android:name'] === permission
      );
      if (!exists) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    // Add receiver
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }
    
    const receiverExists = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.SmsFilterReceiver'
    );
    
    if (!receiverExists) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.SmsFilterReceiver',
          'android:exported': 'true',
          'android:permission': 'android.permission.BROADCAST_SMS'
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }
            ]
          }
        ]
      });
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
      
      const sourcePath = path.join(projectRoot, 'targets', 'android-filter', 'SmsFilterReceiver.kt');
      const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath);
      const destPath = path.join(destDir, 'SmsFilterReceiver.kt');

      if (fs.existsSync(sourcePath)) {
        fs.mkdirSync(destDir, { recursive: true });
        
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
