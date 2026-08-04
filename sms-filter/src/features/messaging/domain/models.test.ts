import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_MESSAGE_PREVIEW_LENGTH,
  MAX_PAGE_SIZE,
  createMessageFromNative,
  createMessagePageFromNative,
  createPageRequest,
  createThreadFromNative,
  toSafeMessagePreview,
} from './models';

const validDecision = {
  category: 'junk',
  riskScore: 0.92,
  reasonCodes: ['KNOWN_SCAM_URL'],
  ruleVersion: 4,
};

const validMessage = {
  id: 'message-1',
  threadId: 'thread-1',
  senderLabel: 'Bilinmeyen gönderici',
  direction: 'incoming',
  timestampMs: 1_775_000_000_000,
  preview: 'Hesabınız askıya alındı. Bağlantıyı açmayın.',
  isRead: false,
  classification: {
    decision: validDecision,
    classifiedAtMs: 1_775_000_000_100,
  },
};

test('native mesajı ortak filtre kararıyla doğrulanmış immutable modele dönüştürür', () => {
  const message = createMessageFromNative(validMessage);

  assert.equal(message.classification.bucket, 'spam');
  assert.deepEqual(message.classification.decision, validDecision);
  assert.ok(Object.isFrozen(message));
  assert.ok(Object.isFrozen(message.classification));
  assert.ok(Object.isFrozen(message.classification.decision));
  assert.ok(Object.isFrozen(message.classification.decision.reasonCodes));
});

test('tam mesaj gövdesinin native sınırdan domain modeline girmesini reddeder', () => {
  for (const sensitiveField of ['body', 'text', 'messageBody', 'content']) {
    assert.throws(
      () => createMessageFromNative({ ...validMessage, [sensitiveField]: 'Gizli SMS içeriği' }),
      /message body/i,
    );
  }
});

test('bozuk native mesaj alanlarını ve geçersiz sınıflandırmayı reddeder', () => {
  assert.throws(
    () => createMessageFromNative({ ...validMessage, id: '' }),
    /id/i,
  );
  assert.throws(
    () => createMessageFromNative({ ...validMessage, timestampMs: Number.NaN }),
    /timestampMs/i,
  );
  assert.throws(
    () => createMessageFromNative({
      ...validMessage,
      classification: {
        decision: { ...validDecision, riskScore: 9 },
        classifiedAtMs: 1_775_000_000_100,
      },
    }),
    /decision/i,
  );
});

test('önizlemeyi tek satıra çevirir, kontrol karakterlerini temizler ve Unicode sınırında kısaltır', () => {
  assert.equal(toSafeMessagePreview('  Merhaba\n\tdünya\u0000  '), 'Merhaba dünya');
  assert.equal(toSafeMessagePreview('Banka\u202E123\u200B'), 'Banka123');

  const preview = toSafeMessagePreview(`${'a'.repeat(MAX_MESSAGE_PREVIEW_LENGTH - 1)}😀son`);
  assert.equal([...preview].length, MAX_MESSAGE_PREVIEW_LENGTH);
  assert.ok(preview.endsWith('…'));
  assert.equal(preview.includes('\ud83d'), false);
});

test('gönderen etiketindeki görünmez ve yön değiştiren karakterleri reddeder', () => {
  assert.throws(
    () => createMessageFromNative({ ...validMessage, senderLabel: 'BANKA\u202E123' }),
    /senderLabel/i,
  );
});

test('konuşmayı güvenli son mesaj önizlemesi ve türetilmiş klasörle oluşturur', () => {
  const thread = createThreadFromNative({
    id: 'thread-1',
    participantLabel: 'Kargo',
    participantAddress: '+905551112233',
    lastMessageId: 'message-1',
    lastMessageAtMs: 1_775_000_000_000,
    lastMessagePreview: '  Paketiniz\n hazır.  ',
    unreadCount: 2,
    messageCount: 5,
    classification: {
      decision: validDecision,
      classifiedAtMs: 1_775_000_000_100,
    },
  });

  assert.equal(thread.lastMessagePreview, 'Paketiniz hazır.');
  assert.equal(thread.participantAddress, '+905551112233');
  assert.equal(thread.bucket, 'spam');
  assert.ok(Object.isFrozen(thread));
});

test('sayfa isteklerinde varsayılanı uygular ve 1-100 sınırını zorunlu kılar', () => {
  assert.deepEqual(createPageRequest(), { cursor: null, limit: 30 });
  assert.deepEqual(createPageRequest({ cursor: 'next-page', limit: MAX_PAGE_SIZE }), {
    cursor: 'next-page',
    limit: MAX_PAGE_SIZE,
  });
  assert.throws(() => createPageRequest({ limit: 0 }), /limit/i);
  assert.throws(() => createPageRequest({ limit: MAX_PAGE_SIZE + 1 }), /limit/i);
  assert.throws(() => createPageRequest({ limit: 2.5 }), /limit/i);
  assert.throws(() => createPageRequest({ cursor: 'x'.repeat(513) }), /cursor/i);
});

test('native mesaj sayfasını doğrular, öğeleri dondurur ve aşırı sayfayı reddeder', () => {
  const page = createMessagePageFromNative({
    items: [validMessage],
    nextCursor: 'page-2',
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.nextCursor, 'page-2');
  assert.ok(Object.isFrozen(page));
  assert.ok(Object.isFrozen(page.items));
  assert.ok(Object.isFrozen(page.items[0]));

  assert.throws(
    () => createMessagePageFromNative({
      items: Array.from({ length: MAX_PAGE_SIZE + 1 }, () => validMessage),
      nextCursor: null,
    }),
    /page/i,
  );
  assert.throws(
    () => createMessagePageFromNative({ items: [{ ...validMessage, direction: 'sideways' }] }),
    /direction/i,
  );
});
