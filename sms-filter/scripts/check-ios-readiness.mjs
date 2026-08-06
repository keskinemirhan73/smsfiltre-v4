import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const configureApp = require('../app.config.js');
const config = configureApp({ config: {} });

if (!config.ios.appleTeamId) {
  throw new Error(
    'iOS build hazır değil: Apple üyeliği tamamlandıktan sonra EXPO_APPLE_TEAM_ID ayarlanmalı.',
  );
}

const appExtensions = config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? [];
const requiredExtensions = [
  ['com.filtreai.app.messagefilter', 'smsfilter'],
  ['com.filtreai.app.smsreport', 'smsreport'],
];

for (const [bundleIdentifier, targetName] of requiredExtensions) {
  const configured = appExtensions.some(
    (extension) => extension.bundleIdentifier === bundleIdentifier
      && extension.targetName === targetName,
  );
  if (!configured) {
    throw new Error(`iOS build hazır değil: ${targetName} imzalama hedefi eksik.`);
  }
}

const reportingPlist = readFileSync(
  new URL('../targets/unwanted-communication/Info.plist', import.meta.url),
  'utf8',
);
if (!/<key>NSExtensionAttributes<\/key>\s*<dict>[\s\S]*?<\/dict>/.test(reportingPlist)) {
  throw new Error(
    'iOS build haz\u0131r de\u011fil: smsreport Info.plist i\u00e7inde NSExtensionAttributes s\u00f6zl\u00fc\u011f\u00fc eksik.',
  );
}

console.log('iOS kimlikleri hazır: ana uygulama, mesaj filtresi, raporlama paneli ve App Group yapılandırıldı.');
