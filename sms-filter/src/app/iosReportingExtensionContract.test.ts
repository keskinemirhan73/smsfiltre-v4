import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import plistParser from '@expo/plist';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const targetRoot = resolve(projectRoot, 'targets/unwanted-communication');

const readTargetFile = (name: string) => readFileSync(resolve(targetRoot, name), 'utf8');

test('iOS raporlama targeti doğru extension tipini ve bundle kimliğini kullanır', () => {
  const config = readTargetFile('expo-target.config.js');
  const plist = readTargetFile('Info.plist');
  const parsedPlist = plistParser.parse(plist) as {
    NSExtension?: {
      NSExtensionAttributes?: {
        ILClassificationExtensionSMSReportDestination?: unknown;
      };
    };
  };

  assert.match(config, /type:\s*["']unwanted-communication["']/);
  assert.match(config, /bundleIdentifier:\s*["']\.smsreport["']/);
  assert.match(plist, /com\.apple\.identitylookup\.classification-ui/);
  assert.match(plist, /\$\(PRODUCT_MODULE_NAME\)\.ClassificationViewController/);
  assert.equal(
    parsedPlist.NSExtension?.NSExtensionAttributes?.ILClassificationExtensionSMSReportDestination,
    '+905438260667',
    'Onaylı SMS rapor hedefi doğrudan NSExtensionAttributes altında bulunmalıdır.',
  );
  assert.doesNotMatch(plist, /ILClassificationExtensionNetworkReportDestination/);
});

test('EAS yeni raporlama targeti için ayrı imzalama profili üretir', () => {
  const targetConfig = readTargetFile('expo-target.config.js');
  const appConfig = JSON.parse(readFileSync(resolve(projectRoot, 'app.json'), 'utf8'));
  const extensions = appConfig.expo.extra.eas.build.experimental.ios.appExtensions;

  const reportingExtension = extensions.find(
    (extension: { bundleIdentifier?: string; targetName?: string }) =>
      extension.bundleIdentifier === 'com.filtreai.app.smsreport'
      && extension.targetName === 'smsreport',
  );
  assert.ok(reportingExtension);
  assert.deepEqual(
    reportingExtension.entitlements?.['com.apple.security.application-groups'],
    ['group.com.filtreai.app'],
  );
  assert.match(targetConfig, /com\.apple\.security\.application-groups/);
  assert.match(targetConfig, /group\.com\.filtreai\.app/);
});

test('iOS raporlama paneli dört sınıf sunar ve seçim yapılmadan Bitti düğmesini açmaz', () => {
  const source = readTargetFile('ClassificationViewController.swift');

  assert.match(source, /import IdentityLookup/);
  assert.match(source, /import IdentityLookupUI/);
  assert.match(source, /ILClassificationUIExtensionViewController/);
  assert.match(source, /İstenmeyen/);
  assert.match(source, /İzin Verilen/);
  assert.match(source, /İşlem/);
  assert.match(source, /Promosyon/);
  assert.match(source, /extensionContext\.isReadyForClassificationResponse\s*=\s*false/);
  assert.match(source, /extensionContext\.isReadyForClassificationResponse\s*=\s*true/);
  assert.match(source, /Göndermeden önce onaylayabilir veya iptal edebilirsiniz/);
  assert.match(source, /Standart SMS\/operatör ücretleri uygulanabilir/);
  assert.match(source, /İşlem ve Promosyon seçimleri ile çağrı bildirimleri SMS göndermez/);
  assert.match(source, /telefon numaranız alıcı tarafından görülebilir/i);
});

test('iOS raporlama yanıtları güvenli Apple sınıflandırma eylemlerine eşlenir', () => {
  const source = readTargetFile('ClassificationViewController.swift');

  assert.match(source, /override func prepare\(for request: ILClassificationRequest\)/);
  assert.match(source, /override func classificationResponse\(for request: ILClassificationRequest\) -> ILClassificationResponse/);
  assert.match(source, /guard let messageRequest = request as\? ILMessageClassificationRequest else/);
  assert.match(source, /case \.junk: return \.reportJunk/);
  assert.doesNotMatch(source, /\.reportJunkAndBlockSender/);
  assert.doesNotMatch(source, /sistem engel listesine ekler/);
  assert.match(source, /\.reportNotJunk/);
  assert.match(source, /ILClassificationResponse\(action:/);
  assert.match(source, /response\.userInfo\s*=\s*\["category": category\.rawValue\]/);
  assert.match(source, /çağrı bildirimleri SMS göndermez/i);
});

test('iOS reporting panel writes a masked selection to the App Group event queue', () => {
  const source = readTargetFile('ClassificationViewController.swift');

  assert.match(source, /UserDefaults\(suiteName:\s*"group\.com\.filtreai\.app"\)/);
  assert.match(source, /smsfilter_report_event_queue_json/);
  assert.doesNotMatch(source, /"smsfilter_event_queue_json"/);
  assert.match(source, /messageRequest\.messageCommunications/);
  assert.match(source, /communication\.sender/);
  assert.match(source, /guard trimmed\.count > 4 else \{ return "\*\*\*" \}/);
  assert.match(source, /persistReportEvents\(from:\s*messageRequest,\s*category:\s*category\)/);
  assert.match(source, /"status":\s*category\.eventStatus/);
  assert.match(source, /"timestamp":/);
  assert.match(source, /"source":\s*"report"/);
  assert.match(source, /smsfilter_pending_sender_override_ids_json/);
  assert.match(source, /smsfilter_pending_sender_override_/);
  assert.match(source, /"sender":\s*sender/);
  assert.match(source, /"category":\s*category\.rawValue/);
  assert.match(source, /CharacterSet\.controlCharacters/);
  assert.match(source, /sender\.count <= 64/);
  assert.doesNotMatch(source, /rawSender[^\n]*prefix\(64\)/);
  assert.match(source, /FiltreAI'yi açıp kuralı onaylayın/);
  assert.match(source, /defaults\.set\(encoded, forKey: eventQueueKey\)/);
  assert.match(source, /defaults\.synchronize\(\)/);
  assert.doesNotMatch(source, /communication\.messageBody/);

  const managerSource = readFileSync(resolve(projectRoot, 'src/modules/FilterManager.ts'), 'utf8');
  assert.match(managerSource, /smsfilter_report_event_queue_json/);
});
