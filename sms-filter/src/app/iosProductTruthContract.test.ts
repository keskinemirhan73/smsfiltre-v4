import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('iOS 26 kurulumu sistem spam filtresini kapatmayi istemez', () => {
  const onboarding = readFileSync(resolve(projectRoot, 'src/screens/OnboardingScreen.tsx'), 'utf8');
  const translations = readFileSync(resolve(projectRoot, 'src/i18n.ts'), 'utf8');

  assert.match(onboarding, /Bilinmeyen Gönderenleri Tara/);
  assert.match(onboarding, /Metin Mesajı Filtresi/);
  assert.match(onboarding, /Apple’ın Spam Filtresini açık bırakabilirsiniz/);
  assert.doesNotMatch(onboarding, /Disable default "Filter Junk"/);
  assert.doesNotMatch(onboarding, /İstenmeyenleri Filtrele.*devre dışı/);
  assert.match(translations, /Metin Mesajı Filtresi/);
  assert.match(translations, /Text Message Filter/);
  assert.doesNotMatch(translations, /Bilinmeyenleri Filtrele \(veya İstenmeyenler\)/);
});

test('raporlama aciklamasi Apple rapor SMS verisini maskeli diye tanitmaz', () => {
  const dashboard = readFileSync(resolve(projectRoot, 'src/screens/DashboardScreen.tsx'), 'utf8');

  assert.doesNotMatch(dashboard, /maskelenmiş içerik gönderilir/);
  assert.match(dashboard, /Apple rapor SMS’i göndereni ve mesaj içeriğini içerebilir/);
  assert.match(dashboard, /standart SMS ücreti/i);
});
