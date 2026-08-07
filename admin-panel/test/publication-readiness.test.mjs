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
const rootLayout = readFileSync(
  new URL('../src/app/layout.tsx', import.meta.url),
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
const mobileAppSource = readFileSync(
  new URL('../../sms-filter/App.tsx', import.meta.url),
  'utf8',
);
const onboardingScreen = readFileSync(
  new URL('../../sms-filter/src/screens/OnboardingScreen.tsx', import.meta.url),
  'utf8',
);
const threatCloudService = readFileSync(
  new URL('../../sms-filter/src/services/ThreatCloudService.ts', import.meta.url),
  'utf8',
);
const mobileGitignore = readFileSync(
  new URL('../../sms-filter/.gitignore', import.meta.url),
  'utf8',
);
const mobileEasignore = readFileSync(
  new URL('../../sms-filter/.easignore', import.meta.url),
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
const verifyTwoFactorRoute = readFileSync(
  new URL('../src/app/api/admin/verify-2fa/route.ts', import.meta.url),
  'utf8',
);
const sendNotificationRoute = readFileSync(
  new URL('../src/app/api/admin/send-notification/route.ts', import.meta.url),
  'utf8',
);
const adminSecrets = readFileSync(
  new URL('../src/lib/adminSecrets.ts', import.meta.url),
  'utf8',
);

const googlePlayReleaseNotes = readFileSync(
  new URL(
    '../../sms-filter/store-assets/google-play/release-notes-1.0.8-tr.txt',
    import.meta.url,
  ),
  'utf8',
);

test('privacy disclosures cover every off-device data flow', () => {
  for (const disclosure of [
    /spam bildirim/i,
    /push.*token/i,
    /IP adres/i,
    /saklama/i,
    /silinme/i,
    /rehber[\s\S]{0,300}beyaz liste/i,
  ]) {
    assert.match(privacyPage, disclosure);
    assert.match(mobilePrivacyPolicy, disclosure);
  }

  for (const content of [privacyPage, mobilePrivacyPolicy]) {
    assert.match(content, /Akıllı Analiz[\s\S]{0,250}cihaz/i);
    assert.match(content, /1\.0\.7[\s\S]{0,500}sunucu/i);
    assert.match(content, /1\.0\.8[\s\S]{0,500}cihaz/i);
    assert.doesNotMatch(content, /analiz önbelle/i);
    assert.match(content, /\+905438260667/);
    assert.match(content, /onaylayabilir veya iptal/i);
    assert.match(content, /SMS\/operatör ücretleri/i);
    assert.match(content, /telefon numaranız[\s\S]{0,100}görülebilir/i);
    assert.match(content, /sabit otomatik silme süresi/i);
    assert.match(content, /çağrı\s+bildirimleri SMS göndermez/i);
    assert.match(content, /operatörün SMS[\s\S]{0,50}altyapısıyla iletilir/i);
    assert.match(content, /6 Ağustos 2026/i);
  }
});

test('next release metadata identifies the fixed local-analysis build', () => {
  assert.equal(mobileAppConfig.expo.version, '1.0.8');
  assert.match(googlePlayReleaseNotes, /cihaz üzerinde/i);
  assert.match(googlePlayReleaseNotes, /bildirim izni/i);
  assert.match(googlePlayReleaseNotes, /güvenli depolama/i);
  assert.ok(googlePlayReleaseNotes.trim().length <= 500);
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
  assert.doesNotMatch(analysisScreen, /Yapay zekanın|Think the AI/i);
});

test('mobile UI avoids fake leaderboard, fake seed threats, and platform-wrong onboarding', () => {
  assert.doesNotMatch(mobileAppSource, /name=["']Liderlik["']/);
  assert.doesNotMatch(threatCloudService, /\+905551234567/);
  assert.doesNotMatch(threatCloudService, /%100 güvenli|limitsiz sunucu/i);
  assert.match(onboardingScreen, /Platform\.OS === ['"]android['"]/);
  assert.match(onboardingScreen, /Continue|Devam Et/);
  assert.doesNotMatch(
    mobileTranslations,
    /Bulut Veritabanı Güncel|Cloud Database Up-to-Date|Son Engellenenler|Recently Blocked|Haftalık Engelleme/i,
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

test('site-wide metadata consistently uses the FiltreAI brand', () => {
  assert.match(rootLayout, /title:\s*["']FiltreAI["']/);
  assert.match(rootLayout, /description:\s*["'][^"']*FiltreAI[^"']*["']/);
  assert.match(rootLayout, /<html\s+lang=["']tr["']/);
  assert.doesNotMatch(rootLayout, /Create Next App|Generated by create next app/i);
});

test('EAS credential exports are ignored by Git', () => {
  assert.match(mobileGitignore, /^\/credentials\.json$/m);
  assert.match(mobileGitignore, /^\/credentials\/$/m);
  assert.match(mobileEasignore, /^credentials\.json$/m);
  assert.match(mobileEasignore, /^credentials\/$/m);
  assert.match(mobileEasignore, /^\*\.jks$/m);
});

test('mobile settings exposes the public privacy policy', () => {
  assert.match(mobileSettingsScreen, /Gizlilik Politikası/i);
  assert.match(
    mobileSettingsScreen,
    /https:\/\/filtreai\.vercel\.app\/privacy/,
  );
  assert.equal(
    googlePlayListing.privacyPolicyUrl,
    'https://filtreai.vercel.app/privacy',
  );
  assert.equal(
    appStoreListing.privacyPolicyUrl,
    'https://filtreai.vercel.app/privacy',
  );
  assert.equal(appStoreListing.supportUrl, 'https://filtreai.vercel.app');
});

test('EAS owns and auto-increments store build numbers', () => {
  assert.equal(easConfig.cli.appVersionSource, 'remote');
  assert.equal(easConfig.build.production.autoIncrement, true);
  assert.equal(mobileAppConfig.expo.android.versionCode, undefined);
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
  assert.match(
    googlePlaySmsDeclaration.coreFunctionality,
    /Akıllı Analiz[\s\S]{0,200}cihaz/i,
  );
  assert.doesNotMatch(
    googlePlaySmsDeclaration.coreFunctionality,
    /Akıllı Analiz ve Spam Bildir/i,
  );
  assert.equal(googlePlayDataSafety.collectsData, true);
  assert.equal(googlePlayDataSafety.sharesData, false);
  assert.equal(googlePlayDataSafety.encryptedInTransit, true);
  assert.equal(appStorePrivacy.tracking, false);
  assert.ok(appStorePrivacy.dataTypes.length >= 5);
  assert.ok(
    appStorePrivacy.dataTypes.some(
      (entry) => entry.type === 'Contact Info > Phone Number'
        && entry.collected === true
        && entry.linkedToUser === true,
    ),
  );
  assert.match(googlePlayListing.fullDescription, /Akıllı Analiz[\s\S]{0,200}cihaz/i);
  assert.doesNotMatch(
    googlePlayListing.fullDescription,
    /Akıllı Analiz[^.]{0,200}sunucuya (?:iletilir|gönderilir)/i,
  );

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

test('native filters honor the user-facing whitelist and schedule settings', () => {
  for (const requiredSetting of [
    /whitelist/,
    /filterScheduleEnabled/,
    /scheduleStart/,
    /scheduleEnd/,
    /blockForeignNumbers/,
    /blockArabic/,
  ]) {
    assert.match(iosMessageFilterExtension, requiredSetting);
    assert.match(androidSmsReceiver, requiredSetting);
  }

  assert.match(iosMessageFilterExtension, /categoryMapping/);
  assert.doesNotMatch(
    mobileSettingsScreen,
    /Daily Summary Only|Sadece Günlük Özet/,
  );
  assert.doesNotMatch(
    mobileSettingsScreen,
    /navigation\.navigate\(['"]Proactive['"]\)/,
  );
  assert.match(
    mobileSettingsScreen,
    /Platform\.OS === ['"]ios['"][\s\S]{0,500}navigation\.navigate\(['"]Mapping['"]\)/,
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
  assert.equal(
    (androidSmsReceiver.match(/if \(keyword\.isBlank\(\)\) continue/g) ?? []).length,
    2,
  );
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
    /cihazınızda analiz edilir/i,
  );
});

test('admin APIs fail closed without production secrets', () => {
  for (const route of [verifyTwoFactorRoute, sendNotificationRoute]) {
    assert.doesNotMatch(route, /ADMIN_PASSWORD\s*\|\|\s*['"]admin['"]/);
    assert.doesNotMatch(route, /ADMIN_TOTP_SECRET\s*\|\|/);
    assert.doesNotMatch(route, /pass(?:word)?\s*===\s*['"]admin['"]/);
    assert.match(route, /503/);
  }
});

test('admin credentials have one environment-only source with no legacy fallback', () => {
  assert.match(
    adminSecrets,
    /process\.env\.ADMIN_PASSWORD\?\.trim\(\)/,
  );
  assert.match(
    adminSecrets,
    /process\.env\.ADMIN_TOTP_SECRET\?\.trim\(\)/,
  );
  assert.doesNotMatch(
    adminSecrets,
    /ADMIN_(?:PASSWORD|TOTP_SECRET)[^;\n]*(?:\|\||\?\?)/,
  );
  assert.doesNotMatch(adminSecrets, /OLD|LEGACY|PREVIOUS|FALLBACK/i);

  for (const route of [verifyTwoFactorRoute, sendNotificationRoute]) {
    assert.match(route, /getAdminSecrets\(\)/);
    assert.doesNotMatch(route, /process\.env\.(?:ADMIN_PASSWORD|ADMIN_TOTP_SECRET)/);
  }
});

test('SMS permission follows a prominent disclosure and consent flow', () => {
  assert.match(smsPermissionService, /PermissionsAndroid\.request/);
  assert.match(smsPermissionService, /cihaz üzerinde/i);
  assert.match(
    smsPermissionService,
    /otomatik olarak sunucuya gönderilmez/i,
  );
});
