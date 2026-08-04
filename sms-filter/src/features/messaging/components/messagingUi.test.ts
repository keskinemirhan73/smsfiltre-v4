import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canSendMessage,
  createClientMessageId,
  createSendSmsRequest,
  createValidatedSmsDraft,
  estimateSmsSegments,
  getAvatarLabel,
  createMessageThreadViewModel,
  createConversationMessagePageFromNative,
  getThreadAccessibilityLabel,
  type MessageThread,
} from './messagingUi';
import { createThreadFromNative } from '../domain/models';

const baseThread: MessageThread = {
  id: 'thread-id',
  displayName: 'Bilinmeyen gönderici',
  address: 'masked-sender',
  preview: 'Mesaj önizlemesi',
  timestampLabel: 'Şimdi',
  unreadCount: 0,
  category: 'inbox',
};

describe('messaging UI helpers', () => {
  it('creates a privacy-safe avatar label without exposing the full sender', () => {
    assert.equal(getAvatarLabel('Filtre AI'), 'FA');
    assert.equal(getAvatarLabel('  '), '?');
    assert.equal(getAvatarLabel('Servis'), 'S');
  });

  it('requires both a recipient and non-whitespace content before sending', () => {
    assert.equal(canSendMessage('Merhaba', '+90 555 111 22 33'), true);
    assert.equal(canSendMessage('   ', '+90 555 111 22 33'), false);
    assert.equal(canSendMessage('Merhaba', '  '), false);
    assert.equal(canSendMessage('Merhaba', 'smsto:+905551112233'), false);
    assert.equal(canSendMessage('Merhaba', '+90555;112233'), false);
    assert.equal(canSendMessage('x'.repeat(1601), '+905551112233'), false);
  });

  it('normalizes a dialable recipient and rejects unsafe SENDTO-style input', () => {
    assert.deepEqual(createValidatedSmsDraft(' Merhaba ', '+90 (555) 111-22-33'), {
      recipientAddress: '+905551112233',
      body: 'Merhaba',
    });
    assert.throws(() => createValidatedSmsDraft('Merhaba', 'sms:+905551112233'), /recipient/i);
    assert.throws(() => createValidatedSmsDraft('Merhaba', '555\u202E1234'), /recipient/i);
    assert.throws(() => createValidatedSmsDraft('x'.repeat(1601), '5551'), /body/i);
  });

  it('shows a conservative SMS segment estimate', () => {
    assert.equal(estimateSmsSegments('a'.repeat(160)), 1);
    assert.equal(estimateSmsSegments('a'.repeat(161)), 2);
    assert.equal(estimateSmsSegments('ğ'.repeat(71)), 2);
    assert.equal(estimateSmsSegments('{'.repeat(160)), 3);
    assert.equal(estimateSmsSegments('😀'.repeat(36)), 2);
  });

  it('creates an immutable idempotent send request', () => {
    const draft = createValidatedSmsDraft('Merhaba', '+905551112233');
    const request = createSendSmsRequest(draft, createClientMessageId(123456, 1));
    assert.equal(request.clientMessageId, 'sms-2n9c-1');
    assert.ok(Object.isFrozen(request));
    assert.throws(() => createSendSmsRequest(draft, '../unsafe'), /client message id/i);
  });

  it('announces unread and spam context without reading the message body', () => {
    assert.equal(
      getThreadAccessibilityLabel({ ...baseThread, unreadCount: 2, category: 'spam' }, 'tr'),
      'Bilinmeyen gönderici, spam, 2 okunmamış mesaj',
    );
    assert.equal(
      getThreadAccessibilityLabel(baseThread, 'en'),
      'Bilinmeyen gönderici, inbox',
    );
  });

  it('projects only a validated immutable domain thread into the UI', () => {
    const domainThread = createThreadFromNative({
      id: 'thread-1',
      participantLabel: 'Kargo',
      participantAddress: '+905551112233',
      lastMessageId: 'message-1',
      lastMessageAtMs: 123,
      lastMessagePreview: 'Paketiniz hazır',
      unreadCount: 1,
      messageCount: 1,
      classification: {
        decision: {
          category: 'junk',
          riskScore: 0.9,
          reasonCodes: ['KNOWN_SPAM_SENDER'],
          ruleVersion: 1,
        },
        bucket: 'spam',
        classifiedAtMs: 123,
      },
    });
    const viewModel = createMessageThreadViewModel(domainThread, 'Şimdi');
    assert.equal(viewModel.category, 'spam');
    assert.equal(viewModel.address, '+905551112233');
    assert.equal(viewModel.preview, 'Yeni mesaj');
    assert.equal(
      createMessageThreadViewModel(domainThread, 'Şimdi', { showSensitivePreview: true }).preview,
      'Paketiniz hazır',
    );
    assert.ok(Object.isFrozen(viewModel));

    assert.throws(
      () => createMessageThreadViewModel(Object.freeze({
        ...domainThread,
        participantAddress: 'x'.repeat(161),
      }), 'Şimdi'),
      /participantAddress/i,
    );
  });

  it('bounds and freezes on-demand conversation message pages', () => {
    const page = createConversationMessagePageFromNative([{
      id: 'message-1',
      direction: 'incoming',
      body: 'Banka\u202E123',
      timestampLabel: 'Şimdi',
      deliveryState: 'delivered',
    }]);
    assert.equal(page[0].body, 'Banka123');
    assert.ok(Object.isFrozen(page));
    assert.ok(Object.isFrozen(page[0]));
    assert.throws(
      () => createConversationMessagePageFromNative(Array.from({ length: 101 }, () => ({
        id: 'm', direction: 'incoming', body: 'x', timestampLabel: 'now',
      }))),
      /page/i,
    );
    assert.throws(
      () => createConversationMessagePageFromNative([{
        id: 'm', direction: 'incoming', body: 'x'.repeat(8193), timestampLabel: 'now',
      }]),
      /body/i,
    );
  });
});
