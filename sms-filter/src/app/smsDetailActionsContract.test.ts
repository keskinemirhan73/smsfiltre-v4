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

test('SMS detayındaki kategori seçimi gerçek gönderici kuralını kaydeder', () => {
  assert.match(detailModal, /key:\s*['"]junk['"]/);
  assert.match(detailModal, /key:\s*['"]allowed['"]/);
  assert.match(detailModal, /key:\s*['"]transaction['"]/);
  assert.match(detailModal, /key:\s*['"]promotion['"]/);
  assert.match(detailModal, /onCategorizeSender\(item\.sender, selectedCategory\)/);
  assert.match(detailModal, /Kategoriyi Kaydet/);
});
