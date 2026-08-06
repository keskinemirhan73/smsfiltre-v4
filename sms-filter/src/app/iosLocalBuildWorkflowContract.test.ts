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
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- codex\/ios-local-build/);
  assert.match(workflow, /runs-on:\s*macos-15/);
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
  assert.match(workflow, /group\.com\.filtreai\.app/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});
