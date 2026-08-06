const assert = require('node:assert/strict');
const test = require('node:test');

const { deliverPushBroadcast } = require('../src/services/pushDelivery');

test('bildirimleri yüksek öncelikli ve Android kanal bilgisiyle parçalı gönderir', async () => {
  const sentChunks = [];
  const expo = {
    chunkPushNotifications(messages) {
      return [messages.slice(0, 1), messages.slice(1)];
    },
    async sendPushNotificationsAsync(chunk) {
      sentChunks.push(chunk);
      return chunk.map(() => ({ status: 'ok', id: 'ticket-id' }));
    },
  };

  const result = await deliverPushBroadcast({
    expo,
    isValidToken: () => true,
    tokens: ['ExponentPushToken[a]', 'ExponentPushToken[b]'],
    title: 'Başlık',
    body: 'İçerik',
  });

  assert.equal(result.successCount, 2);
  assert.equal(result.failureCount, 0);
  assert.equal(sentChunks.length, 2);
  assert.equal(sentChunks[0][0].priority, 'high');
  assert.equal(sentChunks[0][0].channelId, 'default');
  assert.deepEqual(sentChunks[0][0].data, { type: 'admin_broadcast' });
});

test('geçersiz ve DeviceNotRegistered tokenlarını temizleme listesine alır', async () => {
  const expo = {
    chunkPushNotifications(messages) {
      return [messages];
    },
    async sendPushNotificationsAsync() {
      return [{
        status: 'error',
        message: 'not registered',
        details: { error: 'DeviceNotRegistered' },
      }];
    },
  };

  const result = await deliverPushBroadcast({
    expo,
    isValidToken: (token) => token !== 'bad-token',
    tokens: ['bad-token', 'ExponentPushToken[stale]'],
    title: 'Başlık',
    body: 'İçerik',
  });

  assert.equal(result.successCount, 0);
  assert.equal(result.failureCount, 2);
  assert.deepEqual(result.staleTokens.sort(), [
    'ExponentPushToken[stale]',
    'bad-token',
  ]);
});
