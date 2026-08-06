function createMessage(token, title, body) {
  return {
    to: token,
    sound: 'default',
    title,
    body,
    priority: 'high',
    channelId: 'default',
    data: { type: 'admin_broadcast' },
  };
}

async function deliverPushBroadcast({ expo, isValidToken, tokens, title, body }) {
  const tokenGroups = tokens.reduce(
    (groups, token) => isValidToken(token)
      ? { ...groups, valid: [...groups.valid, token] }
      : { ...groups, stale: [...groups.stale, token] },
    { valid: [], stale: [] },
  );
  const staleTokens = tokenGroups.stale;
  const validTokens = tokenGroups.valid;
  const messages = validTokens.map(token => createMessage(token, title, body));
  const chunks = expo.chunkPushNotifications(messages);
  let successCount = 0;
  let failureCount = staleTokens.length;
  let offset = 0;

  for (const chunk of chunks) {
    const chunkTokens = validTokens.slice(offset, offset + chunk.length);
    offset += chunk.length;
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          successCount += 1;
          return;
        }

        failureCount += 1;
        if (ticket.details?.error === 'DeviceNotRegistered') {
          staleTokens.push(chunkTokens[index]);
        }
      });
    } catch (error) {
      console.error('[PUSH CHUNK ERROR]', error);
      failureCount += chunk.length;
    }
  }

  return {
    attemptedCount: tokens.length,
    successCount,
    failureCount,
    staleTokens: [...new Set(staleTokens)],
  };
}

module.exports = { deliverPushBroadcast };
