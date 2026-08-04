import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const configureApp = require('../app.config.js');
const config = configureApp({ config: {} });

if (!config.ios.appleTeamId) {
  throw new Error(
    'iOS build hazır değil: Apple üyeliği tamamlandıktan sonra EXPO_APPLE_TEAM_ID ayarlanmalı.',
  );
}

console.log('iOS kimlikleri hazır: ana uygulama, mesaj filtresi ve App Group yapılandırıldı.');
