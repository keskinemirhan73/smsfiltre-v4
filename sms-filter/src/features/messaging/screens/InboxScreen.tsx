import React, { useMemo, useState } from 'react';
import { Inbox, MessageSquarePlus, Search, ShieldAlert, X } from 'lucide-react-native';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import { ConversationRow } from '../components/ConversationRow';
import { MessagingEmptyState } from '../components/MessagingEmptyState';
import {
  MessagingScreenShell,
  messagingChromeStyles,
} from '../components/MessagingScreenShell';
import type { MessageThread, MessagingLocale } from '../components/messagingUi';

interface InboxScreenProps {
  threads: readonly MessageThread[];
  locale: MessagingLocale;
  spamCount: number;
  onOpenThread: (threadId: string) => void;
  onCompose: () => void;
  onOpenSpam: () => void;
}

export function InboxScreen({
  threads,
  locale,
  spamCount,
  onOpenThread,
  onCompose,
  onOpenSpam,
}: InboxScreenProps) {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const labels = locale === 'tr'
    ? {
        title: 'Mesajlar',
        subtitle: 'FiltreAI korumalı gelen kutusu',
        search: 'Gönderen veya mesaj ara',
        spam: 'Spam kutusu',
        emptyTitle: 'Gelen kutun hazır',
        emptyDescription: 'Yeni mesajlar geldiğinde burada güvenli biçimde listelenecek.',
        noResultTitle: 'Sonuç bulunamadı',
        noResultDescription: 'Arama kelimeni değiştirip tekrar deneyebilirsin.',
        compose: 'Yeni mesaj',
        clearSearch: 'Aramayı temizle',
      }
    : {
        title: 'Messages',
        subtitle: 'Inbox protected by FiltreAI',
        search: 'Search sender or message',
        spam: 'Spam inbox',
        emptyTitle: 'Your inbox is ready',
        emptyDescription: 'New messages will be listed securely here when they arrive.',
        noResultTitle: 'No results',
        noResultDescription: 'Try a different search term.',
        compose: 'New message',
        clearSearch: 'Clear search',
      };

  const inboxThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
    return threads
      .filter((thread) => thread.category !== 'spam')
      .filter((thread) => {
        if (!normalizedQuery) return true;
        return `${thread.displayName} ${thread.preview}`
          .toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')
          .includes(normalizedQuery);
      });
  }, [locale, query, threads]);

  const hasAnyInboxThread = threads.some((thread) => thread.category !== 'spam');

  return (
    <MessagingScreenShell
      title={labels.title}
      subtitle={labels.subtitle}
      actions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.compose}
          onPress={onCompose}
          style={({ pressed }) => [
            messagingChromeStyles.iconButton,
            { backgroundColor: theme.primaryGlow, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MessageSquarePlus size={22} color={theme.primary} />
        </Pressable>
      }
    >
      <View style={styles.toolbar}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={19} color={theme.textMuted} />
          <TextInput
            accessibilityLabel={labels.search}
            value={query}
            onChangeText={setQuery}
            placeholder={labels.search}
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.clearSearch}
              onPress={() => setQuery('')}
              hitSlop={10}
            >
              <X size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSpam}
          style={({ pressed }) => [
            styles.spamButton,
            {
              backgroundColor: `${theme.danger}12`,
              borderColor: `${theme.danger}30`,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ShieldAlert size={18} color={theme.danger} />
          <Text style={[styles.spamLabel, { color: theme.danger }]}>{labels.spam}</Text>
          <View style={[styles.spamCount, { backgroundColor: theme.danger }]}>
            <Text style={styles.spamCountText}>{Math.max(0, spamCount)}</Text>
          </View>
        </Pressable>
      </View>

      <FlatList
        data={inboxThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow thread={item} locale={locale} onPress={onOpenThread} />
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={inboxThreads.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <MessagingEmptyState
            icon={<Inbox size={38} color={theme.primary} />}
            title={hasAnyInboxThread ? labels.noResultTitle : labels.emptyTitle}
            description={hasAnyInboxThread ? labels.noResultDescription : labels.emptyDescription}
          />
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.compose}
        onPress={onCompose}
        style={({ pressed }) => [
          styles.floatingButton,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <MessageSquarePlus size={24} color="#FFFFFF" />
      </Pressable>
    </MessagingScreenShell>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: spacing.md, gap: spacing.sm },
  searchBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  spamButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  spamLabel: { flex: 1, fontSize: 14, fontWeight: '800' },
  spamCount: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spamCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  emptyList: { flexGrow: 1 },
  floatingButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
});
