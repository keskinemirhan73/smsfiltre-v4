import React from 'react';
import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import { ConversationRow } from '../components/ConversationRow';
import { MessagingEmptyState } from '../components/MessagingEmptyState';
import {
  MessagingScreenShell,
  messagingChromeStyles,
} from '../components/MessagingScreenShell';
import type { MessageThread, MessagingLocale } from '../components/messagingUi';

interface SpamScreenProps {
  threads: readonly MessageThread[];
  locale: MessagingLocale;
  onBack: () => void;
  onOpenThread: (threadId: string) => void;
}

export function SpamScreen({ threads, locale, onBack, onOpenThread }: SpamScreenProps) {
  const theme = useAppTheme();
  const labels = locale === 'tr'
    ? {
        title: 'Spam ve riskli',
        subtitle: 'FiltreAI tarafından ayrılan mesajlar',
        back: 'Geri',
        infoTitle: 'Kontrol sende',
        infoDescription: 'Yanlış ayrılan bir mesajı açıp güvenli olarak işaretleyebilirsin.',
        emptyTitle: 'Spam kutusu temiz',
        emptyDescription: 'Riskli olarak ayrılan mesajlar normal gelen kutundan uzakta burada görünür.',
      }
    : {
        title: 'Spam & risky',
        subtitle: 'Messages separated by FiltreAI',
        back: 'Back',
        infoTitle: 'You are in control',
        infoDescription: 'Open an incorrectly classified message and mark it as safe.',
        emptyTitle: 'Spam inbox is clear',
        emptyDescription: 'Messages classified as risky appear here, away from your regular inbox.',
      };
  const spamThreads = threads.filter((thread) => thread.category === 'spam');

  return (
    <MessagingScreenShell
      title={labels.title}
      subtitle={labels.subtitle}
      leading={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.back}
          onPress={onBack}
          style={messagingChromeStyles.iconButton}
        >
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
      }
    >
      <View
        style={[
          styles.infoCard,
          { backgroundColor: `${theme.secondary}12`, borderColor: `${theme.secondary}30` },
        ]}
      >
        <View style={[styles.infoIcon, { backgroundColor: `${theme.secondary}20` }]}>
          <ShieldCheck size={21} color={theme.secondary} />
        </View>
        <View style={styles.infoBody}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>{labels.infoTitle}</Text>
          <Text style={[styles.infoDescription, { color: theme.textMuted }]}>
            {labels.infoDescription}
          </Text>
        </View>
      </View>
      <FlatList
        data={spamThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow thread={item} locale={locale} onPress={onOpenThread} />
        )}
        contentContainerStyle={spamThreads.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <MessagingEmptyState
            icon={<ShieldAlert size={38} color={theme.secondary} />}
            title={labels.emptyTitle}
            description={labels.emptyDescription}
          />
        }
      />
    </MessagingScreenShell>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoBody: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '900' },
  infoDescription: { marginTop: 2, fontSize: 12, lineHeight: 17 },
  emptyList: { flexGrow: 1 },
});
