import React from 'react';
import { BellOff, ShieldAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import {
  getAvatarLabel,
  getThreadAccessibilityLabel,
  type MessageThread,
  type MessagingLocale,
} from './messagingUi';

interface ConversationRowProps {
  thread: MessageThread;
  locale: MessagingLocale;
  onPress: (threadId: string) => void;
}

export function ConversationRow({ thread, locale, onPress }: ConversationRowProps) {
  const theme = useAppTheme();
  const isSpam = thread.category === 'spam';
  const accent = isSpam ? theme.danger : theme.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getThreadAccessibilityLabel(thread, locale)}
      onPress={() => onPress(thread.id)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: `${accent}1F` }]}>
        <Text style={[styles.avatarLabel, { color: accent }]}>
          {getAvatarLabel(thread.displayName)}
        </Text>
        {isSpam ? (
          <View style={[styles.riskBadge, { backgroundColor: theme.danger }]}>
            <ShieldAlert size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              { color: theme.text, fontWeight: thread.unreadCount > 0 ? '900' : '700' },
            ]}
          >
            {thread.displayName}
          </Text>
          <Text style={[styles.time, { color: thread.unreadCount > 0 ? accent : theme.textMuted }]}>
            {thread.timestampLabel}
          </Text>
        </View>
        <View style={styles.bottomLine}>
          <Text
            numberOfLines={1}
            style={[
              styles.preview,
              { color: thread.unreadCount > 0 ? theme.text : theme.textMuted },
            ]}
          >
            {thread.preview}
          </Text>
          {thread.isMuted ? <BellOff size={14} color={theme.textMuted} /> : null}
          {thread.unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
              <Text style={styles.unreadText}>{Math.min(thread.unreadCount, 99)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLabel: { fontSize: 17, fontWeight: '900' },
  riskBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 6 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: 16 },
  time: { fontSize: 11, fontWeight: '700' },
  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  preview: { flex: 1, fontSize: 13, lineHeight: 18 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
