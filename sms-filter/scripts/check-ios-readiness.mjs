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

console.log('iOS kimlikleri hazır: ana uygulama, mesaj filtresi, raporlama paneli ve App Group yapılandırıldı.');
