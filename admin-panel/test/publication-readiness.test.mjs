import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const privacyPage = readFileSync(
  new URL('../src/app/privacy/page.tsx', import.meta.url),
  'utf8',
);
const landingPage = readFileSync(
  new URL('../src/app/page.tsx', import.meta.url),
  'utf8',
);
const mobilePrivacyPolicy = readFileSync(
  new URL('../../sms-filter/PRIVACY_POLICY.md', import.meta.url),
  'utf8',
);
const mobileSettingsScreen = readFileSync(
  new URL('../../sms-filter/src/screens/SettingsScreen.tsx', import.meta.url),
  'utf8',
);
const mobileGitignore = readFileSync(
  new URL('../../sms-filter/.gitignore', import.meta.url),
  'utf8',
);
const mobileAppConfig = JSON.parse(
  readFileSync(new URL('../../sms-filter/app.json', import.meta.url), 'utf8'),
);
const googlePlayListing = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/google-play/listing-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const appStoreListing = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/app-store/listing-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const googlePlaySmsDeclaration = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/google-play/sms-permission-declaration-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const googlePlayDataSafety = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/google-play/data-safety-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const googlePlayPermissionVideoScript = readFileSync(
  new URL(
    '../../sms-filter/store-assets/google-play/permission-video-script-tr.md',
    import.meta.url,
  ),
  'utf8',
);
const googlePlayScreenshotPlan = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/google-play/screenshots-plan-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const appStorePrivacy = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/app-store/app-privacy-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const appStoreScreenshotPlan = JSON.parse(
  readFileSync(
    new URL(
      '../../sms-filter/store-assets/app-store/screenshots-plan-tr.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const mobilePackage = JSON.parse(
  readFileSync(new URL('../../sms-filter/package.json', import.meta.url), 'utf8'),
);
const filterManager = readFileSync(
  new URL('../../sms-filter/src/modules/FilterManager.ts', import.meta.url),
  'utf8',
);
const iosMessageFilterExtension = readFileSync(
  new URL(
    '../../sms-filter/targets/message-filter/MessageFilterExtension.swift',
    import.meta.url,
  ),
  'utf8',
);
const easConfig = JSON.parse(
  readFileSync(new URL('../../sms-filter/eas.json', import.meta.url), 'utf8'),
);
const appleTargetConfig = readFileSync(
  new URL(
    '../../sms-filter/targets/message-filter/expo-target.config.js',
    import.meta.url,
  ),
  'utf8',
);
const appIcon = readFileSync(
  new URL('../../sms-filter/assets/icon.png', import.meta.url),
);
const androidAdaptiveIcon = readFileSync(
  new URL(
    '../../sms-filter/assets/android-icon-foreground-filtreai.png',
    import.meta.url,
  ),
);
const androidMonochromeIcon = readFileSync(
  new URL(
    '../../sms-filter/assets/android-icon-monochrome-filtreai.png',
    import.meta.url,
  ),
);
const googlePlayFeatureGraphic = readFileSync(
  new URL(
    '../../sms-filter/store-assets/google-play/feature-graphic-1024x500.png',
    import.meta.url,
  ),
);
const googlePlayFeatureGraphicAlt = readFileSync(
  new URL(
    '../../sms-filter/store-assets/google-play/feature-graphic-alt.txt',
    import.meta.url,
  ),
  'utf8',
);
const googlePlayHighResIcon = readFileSync(
  new URL(
    '../../sms-filter/store-assets/google-play/high-res-icon-512.png',
    import.meta.url,
  ),
);
const androidSmsPlugin = readFileSync(
  new URL(
    '../../sms-filter/plugins/withAndroidSmsFilter.js',
    import.meta.url,
  ),
  'utf8',
);
const androidSmsReceiver = readFileSync(
  new URL(
    '../../sms-filter/targets/android-filter/SmsFilterReceiver.kt',
    import.meta.url,
  ),
  'utf8',
);
const smsPermissionService = readFileSync(
  new URL(
    '../../sms-filter/src/services/SmsPermissionService.ts',
    import.meta.url,
  ),
  'utf8',
);
const dashboardScreen = readFileSync(
  new URL('../../sms-filter/src/screens/DashboardScreen.tsx', import.meta.url),
  'utf8',
);
const mobileTranslations = readFileSync(
  new URL('../../sms-filter/src/i18n.ts', import.meta.url),
  'utf8',
);
const analysisScreen = readFileSync(
  new URL(
    '../../sms-filter/src/screens/AIAnalysisScreen.tsx',
    import.meta.url,
  ),
  'utf8',
);
const communityRulesScreen = readFileSync(
  new URL(
    '../../sms-filter/src/screens/CommunityRulesScreen.tsx',
    import.meta.url,
  ),
  'utf8',
);
const adminPage = readFileSync(
  new URL('../src/app/admin/page.tsx', import.meta.url),
  'utf8',
);
const termsPage = readFileSync(
  new URL('../src/app/terms/page.tsx', import.meta.url),
  'utf8',
);

test('privacy disclosures cover every off-device data flow', () => {
  for (const disclosure of [
    /mesaj metni/i,
    /kural tabanl/i,
    /push.*token/i,
    /IP adres/i,
    /saklama/i,
    /silinme/i,
    /7 gün/i,
    /rehber[\s\S]{0,300}beyaz liste/i,
  ]) {
    assert.match(privacyPage, disclosure);
    assert.match(mobilePrivacyPolicy, disclosure);
  }
});

test('store-facing content does not promise the removed paid Gemini service', () => {
  const publicContent = [
    privacyPage,
    landingPage,
    mobilePrivacyPolicy,
    analysisScreen,
    communityRulesScreen,
    adminPage,
    termsPage,
    JSON.stringify(googlePlayListing),
    JSON.stringify(appStoreListing),
    JSON.stringify(googlePlayDataSafety),
    JSON.stringify(googlePlaySmsDeclaration),
    JSON.stringify(appStorePrivacy),
  ].join('\n');

  assert.doesNotMatch(publicContent, /Gemini/i);
  assert.doesNotMatch(
    `${googlePlayListing.fullDescription}\n${appStoreListing.promotionalText}\n${appStoreListing.description}`,
    /yapay zek[âa]/i,
  );
});

test('public support and deletion request channels are ready', () => {
  const supportEmail = 'keskinemirhan73@gmail.com';

  assert.match(privacyPage, new RegExp(supportEmail, 'i'));
  assert.match(mobilePrivacyPolicy, new RegExp(supportEmail, 'i'));
  assert.equal(googlePlayListing.supportEmail, supportEmail);
  assert.equal(appStoreListing.supportEmail, supportEmail);
  assert.match(appStoreListing.supportUrl, /^https:\/\//);
  assert.equal(googlePlayDataSafety.deletionRequestAvailable, true);
  assert.equal(googlePlayDataSafety.deletionRequestEmail, supportEmail);
  assert.equal(googlePlayDataSafety.deletionRequestBlocker, null);
});

test('landing page does not claim that all processing is local', () => {
  assert.doesNotMatch(landingPage, /%100 Cihaz İçi Gizlilik/i);
  assert.doesNotMatch(
    landingPage,
    /Kişisel mesajlarınız asla sunucularımıza gitmez/i,
  );
});

test('EAS credential exports are ignored by Git', () => {
  assert.match(mobileGitignore, /^\/credentials\.json$/m);
  assert.match(mobileGitignore, /^\/credentials\/$/m);
});

test('mobile settings exposes the public privacy policy', () => {
  assert.match(mobileSettingsScreen, /Gizlilik Politikası/i);
  assert.match(
    mobileSettingsScreen,
    /https:\/\/smsfiltre-v4\.vercel\.app\/privacy/,
  );
});

test('EAS owns and auto-increments store build numbers', () => {
  assert.equal(easConfig.cli.appVersionSource, 'remote');
  assert.equal(easConfig.build.production.autoIncrement, true);
  assert.equal(mobileAppConfig.expo.cli, undefined);
});

test('Android and iOS identifiers consistently use the FiltreAI namespace', () => {
  assert.equal(mobileAppConfig.expo.android.package, 'com.filtreai.app');
  assert.equal(mobileAppConfig.expo.ios.bundleIdentifier, 'com.filtreai.app');
  assert.equal(mobileAppConfig.expo.ios.supportsTablet, false);
  assert.deepEqual(
    mobileAppConfig.expo.ios.entitlements[
      'com.apple.security.application-groups'
    ],
    ['group.com.filtreai.app'],
  );
  assert.match(
    appleTargetConfig,
    /type:\s*["']message-filter["']/,
    'The iOS extension must be generated as an IdentityLookup message filter',
  );
  assert.match(
    appleTargetConfig,
    /bundleIdentifier:\s*["']\.messagefilter["']/,
  );
  assert.equal(
    mobileAppConfig.expo.extra.eas.build.experimental.ios.appExtensions[0]
      .bundleIdentifier,
    'com.filtreai.app.messagefilter',
  );
  assert.doesNotMatch(appleTargetConfig, /config\.type\s*=/);
});

test('store and Android adaptive icons are real PNG files', () => {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  for (const icon of [appIcon, androidAdaptiveIcon, androidMonochromeIcon]) {
    assert.deepEqual([...icon.subarray(0, 8)], pngSignature);
  }

  assert.equal(androidAdaptiveIcon.readUInt32BE(16), 1024);
  assert.equal(androidAdaptiveIcon.readUInt32BE(20), 1024);
  assert.equal(androidMonochromeIcon.readUInt32BE(16), 1024);
  assert.equal(androidMonochromeIcon.readUInt32BE(20), 1024);
  assert.equal(
    mobileAppConfig.expo.android.adaptiveIcon.foregroundImage,
    './assets/android-icon-foreground-filtreai.png',
  );
  assert.equal(
    mobileAppConfig.expo.android.adaptiveIcon.monochromeImage,
    './assets/android-icon-monochrome-filtreai.png',
  );
});

test('Google Play feature graphic has the required opaque dimensions', () => {
  assert.deepEqual(
    [...googlePlayFeatureGraphic.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  assert.equal(googlePlayFeatureGraphic.readUInt32BE(16), 1024);
  assert.equal(googlePlayFeatureGraphic.readUInt32BE(20), 500);
  assert.equal(googlePlayFeatureGraphic[25], 2);
  assert.ok(googlePlayFeatureGraphicAlt.trim().length > 20);
  assert.ok(googlePlayFeatureGraphicAlt.trim().length <= 140);
});

test('Google Play high-resolution icon meets size and PNG requirements', () => {
  assert.deepEqual(
    [...googlePlayHighResIcon.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  assert.equal(googlePlayHighResIcon.readUInt32BE(16), 512);
  assert.equal(googlePlayHighResIcon.readUInt32BE(20), 512);
  assert.equal(googlePlayHighResIcon[25], 6);
  assert.ok(googlePlayHighResIcon.byteLength <= 1024 * 1024);
});

test('Turkish store metadata stays within Google and Apple limits', () => {
  assert.ok(googlePlayListing.appName.length <= 30);
  assert.ok(googlePlayListing.shortDescription.length <= 80);
  assert.ok(googlePlayListing.fullDescription.length <= 4000);

  assert.ok(appStoreListing.appName.length <= 30);
  assert.ok(appStoreListing.subtitle.length <= 30);
  assert.ok(appStoreListing.promotionalText.length <= 170);
  assert.ok(appStoreListing.description.length <= 4000);
  assert.ok(Buffer.byteLength(appStoreListing.keywords, 'utf8') <= 100);

  assert.doesNotMatch(
    `${googlePlayListing.fullDescription}\n${appStoreListing.description}`,
    /arka planda yapay zek[âa]|mesaj teslimini engeller|yüzde yüz koruma/i,
  );
});

test('store privacy and restricted-permission submission drafts are complete', () => {
  assert.equal(
    googlePlaySmsDeclaration.declaredPermission,
    'android.permission.RECEIVE_SMS',
  );
  assert.match(googlePlaySmsDeclaration.coreUseCase, /spam detection/i);
  assert.equal(googlePlayDataSafety.collectsData, true);
  assert.equal(googlePlayDataSafety.sharesData, false);
  assert.equal(googlePlayDataSafety.encryptedInTransit, true);
  assert.equal(appStorePrivacy.tracking, false);
  assert.ok(appStorePrivacy.dataTypes.length >= 4);

  for (const requiredVideoStep of [
    /uygulamanın verisini temizleyin/i,
    /Şimdi Değil/i,
    /tekrar tetikleyin/i,
    /Devam Et/i,
    /şüpheli bir örnek SMS/i,
  ]) {
    assert.match(googlePlayPermissionVideoScript, requiredVideoStep);
  }
});

test('phone screenshot plans cover the main user journeys', () => {
  assert.equal(googlePlayScreenshotPlan.targetSize, '1080x1920 portrait');
  assert.ok(googlePlayScreenshotPlan.plannedScreenshots.length >= 4);
  assert.ok(
    googlePlayScreenshotPlan.plannedScreenshots.length <=
      googlePlayScreenshotPlan.maximumCount,
  );
  assert.ok(appStoreScreenshotPlan.plannedScreenshots.length >= 1);
  assert.ok(
    appStoreScreenshotPlan.plannedScreenshots.length <=
      appStoreScreenshotPlan.maximumCount,
  );
});

test('iOS app-group storage uses the maintained Apple targets bridge', () => {
  assert.equal(
    mobilePackage.dependencies['react-native-shared-group-preferences'],
    undefined,
  );
  assert.match(filterManager, /ExtensionStorage/);
  assert.doesNotMatch(filterManager, /react-native-shared-group-preferences/);
});

test('iOS never marks every unknown message as junk', () => {
  assert.doesNotMatch(
    iosMessageFilterExtension,
    /if\s+underAttackMode[\s\S]{0,100}response\.action\s*=\s*\.junk/,
  );
  assert.match(
    filterManager,
    /Platform\.OS\s*===\s*['"]android['"]\s*&&\s*settings\.underAttackMode/,
  );
  assert.match(
    mobileSettingsScreen,
    /Platform\.OS\s*===\s*['"]android['"][\s\S]{0,300}t\.underAttack/,
  );
});

test('Android requests only the minimum SMS permission', () => {
  assert.match(androidSmsPlugin, /android\.permission\.RECEIVE_SMS/);
  assert.doesNotMatch(androidSmsPlugin, /android\.permission\.READ_SMS/);
  assert.deepEqual(
    mobileAppConfig.expo.android.blockedPermissions,
    [
      'android.permission.READ_SMS',
      'android.permission.WRITE_CONTACTS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  );
});

test('Android detects suspicious SMS without claiming to abort delivery', () => {
  assert.doesNotMatch(androidSmsReceiver, /abortBroadcast/);
  assert.match(androidSmsReceiver, /showSuspiciousSmsNotification/);
  assert.doesNotMatch(dashboardScreen, /engelleniyor|engellendi/i);
  assert.doesNotMatch(mobileTranslations, /engellenir|engellenmes/i);
});

test('automatic SMS detection is not described as background cloud AI', () => {
  assert.doesNotMatch(
    dashboardScreen,
    /Yapay zeka arka planda SMS’leri tarıyor/i,
  );
  assert.match(
    dashboardScreen,
    /cihaz üzerinde analiz ediyor/i,
  );
});

test('SMS permission follows a prominent disclosure and consent flow', () => {
  assert.match(smsPermissionService, /PermissionsAndroid\.request/);
  assert.match(smsPermissionService, /cihaz üzerinde/i);
  assert.match(
    smsPermissionService,
    /otomatik olarak sunucuya gönderilmez/i,
  );
});
