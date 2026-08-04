import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('platform rotalari Android mesajlasma ile iOS korumayi ayirir', () => {
  const routesSource = readFileSync(
    resolve(projectRoot, 'src/navigation/productRoutes.ts'),
    'utf8',
  );

  assert.match(routesSource, /AndroidMessagingPreview/);
  assert.match(routesSource, /AndroidSmsRoleSetup/);
  assert.match(routesSource, /AndroidMessagingTabs/);
  assert.match(routesSource, /Inbox/);
  assert.match(routesSource, /Spam/);
  assert.match(routesSource, /Conversation/);
  assert.match(routesSource, /Compose/);
  assert.match(routesSource, /Dashboard/);
  assert.match(routesSource, /AIAnalysis/);
  assert.match(routesSource, /Profile/);
  assert.match(routesSource, /Settings/);
});

test('iOS native filtre hedefi Android mesajlasma izinlerinden bagimsiz kalir', () => {
  const iosTargetConfig = readFileSync(
    resolve(projectRoot, 'targets/message-filter/expo-target.config.js'),
    'utf8',
  );
  const iosExtension = readFileSync(
    resolve(projectRoot, 'targets/message-filter/MessageFilterExtension.swift'),
    'utf8',
  );

  assert.doesNotMatch(iosTargetConfig, /READ_SMS|RECEIVE_SMS|ROLE_SMS/);
  assert.doesNotMatch(iosExtension, /READ_SMS|RECEIVE_SMS|ROLE_SMS/);
  assert.match(iosExtension, /ILMessageFilterExtension/);
});
