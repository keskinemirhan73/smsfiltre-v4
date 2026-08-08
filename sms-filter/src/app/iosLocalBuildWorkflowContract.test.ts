import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const workflow = readFileSync(
  resolve(process.cwd(), '../.github/workflows/ios-local-build.yml'),
  'utf8',
);

test('GitHub Actions builds iOS locally on manual dispatch or the release branch', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /branches:[\s\S]*- ['"]main['"]/);
  assert.match(workflow, /branches:[\s\S]*- ['"]codex\/ios-local-build['"]/);
  assert.match(workflow, /runs-on:\s*macos-26/);
  assert.match(workflow, /xcodebuild -version/);
  assert.match(workflow, /xcrun --sdk iphoneos --show-sdk-version/);
  assert.match(workflow, /sdk_major < 26/);
  assert.match(workflow, /SDK major version must be 26 or newer/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /EXPO_TOKEN:\s*\$\{\{ secrets\.EXPO_TOKEN \}\}/);
  assert.match(workflow, /--platform ios/);
  assert.match(workflow, /--profile production/);
  assert.match(workflow, /--local/);
  assert.match(workflow, /--freeze-credentials/);
});

test('workflow verifies the native bridge, report destination, and App Group before upload', () => {
  assert.match(workflow, /ILClassificationExtensionSMSReportDestination/);
  assert.match(workflow, /ExtensionStorage/);
  assert.match(workflow, /smsfilter_report_event_queue_json/);
  assert.equal(
    (workflow.match(/smsfilter_pending_sender_override_queue_json/g) ?? []).length,
    2,
  );
  assert.match(workflow, /strings "\$app\/main\.jsbundle" \| grep -F "getFiles"/);
  assert.match(workflow, /group\.com\.filtreai\.app/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /Submit to App Store Connect[\s\S]*if:\s*github\.ref == ['"]refs\/heads\/main['"]/);
});
