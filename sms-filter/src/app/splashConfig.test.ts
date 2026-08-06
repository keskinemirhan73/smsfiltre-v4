import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

type SplashPlugin = [
  'expo-splash-screen',
  {
    image?: string;
    imageWidth?: number;
    resizeMode?: string;
    backgroundColor?: string;
  },
];

test('Expo splash FiltreAI marka gorselini kullanir', () => {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const appConfig = JSON.parse(
    readFileSync(
      resolve(projectRoot, 'app.json'),
      'utf8',
    ),
  );
  const splashPlugin = appConfig.expo.plugins.find(
    (plugin: string | SplashPlugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  ) as SplashPlugin | undefined;

  assert.ok(splashPlugin, 'expo-splash-screen yapilandirmasi bulunamadi');
  assert.equal(splashPlugin[1].image, './assets/premium_splash.png');
  assert.equal(splashPlugin[1].backgroundColor, '#0F172A');
  assert.equal(splashPlugin[1].resizeMode, 'contain');
  assert.equal(
    existsSync(resolve(projectRoot, 'assets/premium_splash.png')),
    true,
  );

  const easIgnore = readFileSync(resolve(projectRoot, '.easignore'), 'utf8');
  assert.equal(
    easIgnore.split(/\r?\n/).includes('assets/premium_splash.png'),
    false,
    'marka splash gorseli EAS arsivinden haric tutulamaz',
  );
});
