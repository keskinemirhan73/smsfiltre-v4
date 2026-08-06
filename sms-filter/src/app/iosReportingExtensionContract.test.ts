import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const targetRoot = resolve(projectRoot, 'targets/unwanted-communication');

const readTargetFile = (name: string) => readFileSync(resolve(targetRoot, name), 'utf8');

test('iOS raporlama targeti doğru extension tipini ve bundle kimliğini kullanır', () => {
  const config = readTargetFile('expo-target.config.js');
  const plist = readTargetFile('Info.plist');

  assert.match(config, /type:\s*["']unwanted-communication["']/);
  assert.match(config, /bundleIdentifier:\s*["']\.smsreport["']/);
  assert.match(plist, /com\.apple\.identitylookup\.classification-ui/);
  assert.match(plist, /\$\(PRODUCT_MODULE_NAME\)\.ClassificationViewController/);
  assert.match(
    plist,
    /<key>NSExtensionAttributes<\/key>\s*<dict>\s*<\/dict>/,
    'Apple, Unwanted Communication Reporting extension i\u00e7in NSExtensionAttributes s\u00f6zl\u00fc\u011f\u00fcn\u00fc zorunlu tutar.',
  );
  assert.doesNotMatch(plist, /ILClassificationExtension(?:Network|SMS)ReportDestination/);
});

test('EAS yeni raporlama targeti için ayrı imzalama profili üretir', () => {
  const appConfig = JSON.parse(readFileSync(resolve(projectRoot, 'app.json'), 'utf8'));
  const extensions = appConfig.expo.extra.eas.build.experimental.ios.appExtensions;

  assert.ok(
    extensions.some(
      (extension: { bundleIdentifier?: string; targetName?: string }) =>
        extension.bundleIdentifier === 'com.filtreai.app.smsreport'
        && extension.targetName === 'smsreport',
    ),
  );
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
});

test('iOS raporlama yanıtları güvenli Apple sınıflandırma eylemlerine eşlenir', () => {
  const source = readTargetFile('ClassificationViewController.swift');

  assert.match(source, /override func prepare\(for request: ILClassificationRequest\)/);
  assert.match(source, /override func classificationResponse\(for request: ILClassificationRequest\) -> ILClassificationResponse/);
  assert.match(source, /\.reportJunk/);
  assert.match(source, /\.reportNotJunk/);
  assert.match(source, /ILClassificationResponse\(action:/);
  assert.match(source, /response\.userInfo\s*=\s*\["category": category\.rawValue\]/);
});
