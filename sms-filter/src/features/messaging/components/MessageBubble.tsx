import React from 'react';
import { AlertCircle, CheckCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import type { ConversationMessage, MessagingLocale } from './messagingUi';

interface MessageBubbleProps {
  message: ConversationMessage;
  locale: MessagingLocale;
}

export function MessageBubble({ message, locale }: MessageBubbleProps) {
  const theme = useAppTheme();
  const outgoing = message.direction === 'outgoing';
  const failed = message.deliveryState === 'failed';
  const deliveryLabel = message.deliveryState === 'delivered'
    ? (locale === 'tr' ? 'Teslim edildi' : 'Delivered')
    : failed
      ? (locale === 'tr' ? 'Gönderilemedi' : 'Failed')
      : '';

  return (
    <View style={[styles.row, outgoing ? styles.outgoingRow : styles.incomingRow]}>
      <View
        style={[
          styles.bubble,
          outgoing
            ? { backgroundColor: theme.primary }
            : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
        ]}
      >
        <Text style={[styles.body, { color: outgoing ? '#FFFFFF' : theme.text }]}>
          {message.body}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: outgoing ? 'rgba(255,255,255,0.72)' : theme.textMuted }]}>
            {message.timestampLabel}
          </Text>
          {outgoing && message.deliveryState === 'delivered' ? (
            <CheckCheck size={13} color="rgba(255,255,255,0.82)" />
          ) : null}
          {failed ? <AlertCircle size={13} color={theme.danger} /> : null}
          {deliveryLabel ? (
            <Text style={[styles.delivery, { color: failed ? theme.danger : 'rgba(255,255,255,0.82)' }]}>
              {deliveryLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', paddingHorizontal: spacing.md, marginVertical: 4 },
  incomingRow: { alignItems: 'flex-start' },
  outgoingRow: { alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10 },
  body: { fontSize: 15, lineHeight: 21 },
  meta: { marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  time: { fontSize: 10, fontWeight: '600' },
  delivery: { fontSize: 10, fontWeight: '700' },
});
