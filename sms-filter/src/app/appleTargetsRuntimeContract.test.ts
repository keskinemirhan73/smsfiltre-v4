import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const projectRoot = process.cwd();

test('Expo 54 uses the iOS 15-compatible Apple Targets runtime', () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(projectRoot, 'package.json'), 'utf8'),
  ) as { dependencies?: Record<string, string> };
  const podspec = readFileSync(
    resolve(
      projectRoot,
      'node_modules/@bacons/apple-targets/ios/ExtensionStorage.podspec',
    ),
    'utf8',
  );

  assert.equal(packageJson.dependencies?.['@bacons/apple-targets'], '4.0.7');
  assert.match(podspec, /s\.platform\s*=\s*:ios,\s*['"]15\.1['"]/);
});
