import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const detailModal = readFileSync(
  resolve(projectRoot, 'src/components/SmsDetailModal.tsx'),
  'utf8',
);

test('SMS detayında güvenli ve istenmeyen eylemleri kullanıcıya görünür kalır', () => {
  assert.match(detailModal, /İstenmeyen Değil \(Güvenli Yap\)/);
  assert.match(detailModal, /İstenmeyen Olarak Bildir/);
  assert.match(detailModal, /onMarkAsNotJunk\(item\.sender\)/);
  assert.match(detailModal, /onReportAsJunk\(item\.sender, item\.preview\)/);
});
