import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, Send, ShieldCheck } from 'lucide-react-native';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import { MessageBubble } from '../components/MessageBubble';
import { MessagingEmptyState } from '../components/MessagingEmptyState';
import {
  MessagingScreenShell,
  messagingChromeStyles,
} from '../components/MessagingScreenShell';
import {
  canSendMessage,
  createClientMessageId,
  createConversationMessagePageFromNative,
  createSendSmsRequest,
  createValidatedSmsDraft,
  estimateSmsSegments,
  type ConversationMessage,
  type MessagingLocale,
  type SendSmsRequest,
  type SendSmsResult,
} from '../components/messagingUi';

interface ConversationScreenProps {
  displayName: string;
  address: string;
  messages: readonly ConversationMessage[];
  locale: MessagingLocale;
  onBack: () => void;
  onSend: (request: SendSmsRequest) => Promise<SendSmsResult>;
  onOpenActions?: () => void;
}

export function ConversationScreen({
  displayName,
  address,
  messages,
  locale,
  onBack,
  onSend,
  onOpenActions,
}: ConversationScreenProps) {
  const theme = useAppTheme();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const sequence = useRef(0);
  const sendingLock = useRef(false);
  const pendingRequest = useRef<Readonly<{ key: string; request: SendSmsRequest }> | null>(null);
  const labels = locale === 'tr'
    ? {
        back: 'Geri',
        actions: 'Konuşma işlemleri',
        protected: 'Cihazda korunuyor',
        emptyTitle: 'Henüz mesaj yok',
        emptyDescription: 'Bu konuşmadaki mesajlar burada görünecek.',
        input: 'Mesaj yaz',
        send: 'Gönder',
        sending: 'Gönderiliyor',
        sendFailed: 'Gönderilemedi; taslağın korundu.',
        segments: 'parça',
      }
    : {
        back: 'Back',
        actions: 'Conversation actions',
        protected: 'Protected on-device',
        emptyTitle: 'No messages yet',
        emptyDescription: 'Messages in this conversation will appear here.',
        input: 'Write a message',
        send: 'Send',
        sending: 'Sending',
        sendFailed: 'Could not send; your draft was kept.',
        segments: 'segments',
      };
  const sendEnabled = canSendMessage(draft, address);
  const orderedMessages = useMemo(
    () => createConversationMessagePageFromNative(messages),
    [messages],
  );

  const submit = async () => {
    if (!sendEnabled || sendingLock.current) return;
    sendingLock.current = true;
    setIsSending(true);
    setSendError('');
    try {
      const validatedDraft = createValidatedSmsDraft(draft, address);
      const key = `${validatedDraft.recipientAddress}\u0000${validatedDraft.body}`;
      if (pendingRequest.current?.key !== key) {
        sequence.current += 1;
        pendingRequest.current = Object.freeze({
          key,
          request: createSendSmsRequest(
            validatedDraft,
            createClientMessageId(Date.now(), sequence.current),
          ),
        });
      }
      const request = pendingRequest.current.request;
      const result = await onSend(request);
      if (result.ok) {
        pendingRequest.current = null;
        setDraft('');
      }
      else setSendError(result.errorMessage || labels.sendFailed);
    } catch {
      setSendError(labels.sendFailed);
    } finally {
      sendingLock.current = false;
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MessagingScreenShell
        title={displayName}
        subtitle={address}
        leading={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.back}
            onPress={onBack}
            disabled={isSending}
            accessibilityState={{ disabled: isSending }}
            style={messagingChromeStyles.iconButton}
          >
            <ArrowLeft size={24} color={theme.text} />
          </Pressable>
        }
        actions={
          onOpenActions ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.actions}
              onPress={onOpenActions}
              style={messagingChromeStyles.iconButton}
            >
              <MoreVertical size={22} color={theme.text} />
            </Pressable>
          ) : null
        }
        footer={
          <>
            <View
              style={[
                styles.composer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
            <TextInput
              accessibilityLabel={labels.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={labels.input}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
              multiline
              maxLength={1600}
              editable={!isSending}
            />
            <Text style={[styles.segmentCount, { color: theme.textMuted }]}>
              {estimateSmsSegments(draft)} {labels.segments}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.send}
              accessibilityState={{ disabled: !sendEnabled || isSending, busy: isSending }}
              disabled={!sendEnabled || isSending}
              onPress={submit}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: sendEnabled && !isSending ? theme.primary : theme.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Send size={19} color={sendEnabled && !isSending ? '#FFFFFF' : theme.textMuted} />
            </Pressable>
            </View>
            {sendError ? <Text style={[styles.errorText, { color: theme.danger }]}>{sendError}</Text> : null}
          </>
        }
      >
        <View style={[styles.privacyStrip, { backgroundColor: `${theme.secondary}10` }]}>
          <ShieldCheck size={14} color={theme.secondary} />
          <Text style={[styles.privacyText, { color: theme.secondary }]}>{labels.protected}</Text>
        </View>
        <FlatList
          data={orderedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} locale={locale} />}
          contentContainerStyle={[
            styles.messageList,
            orderedMessages.length === 0 ? styles.emptyList : undefined,
          ]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <MessagingEmptyState
              icon={<ShieldCheck size={38} color={theme.secondary} />}
              title={labels.emptyTitle}
              description={labels.emptyDescription}
            />
          }
        />
      </MessagingScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  privacyStrip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  privacyText: { fontSize: 11, fontWeight: '800' },
  messageList: { paddingVertical: spacing.md },
  emptyList: { flexGrow: 1 },
  composer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingLeft: spacing.md,
    paddingRight: 5,
    paddingVertical: 5,
  },
  input: { flex: 1, minHeight: 40, maxHeight: 112, fontSize: 15, paddingTop: 9 },
  segmentCount: { alignSelf: 'center', paddingHorizontal: 4, fontSize: 10, fontWeight: '700' },
  errorText: { paddingHorizontal: spacing.sm, paddingTop: 4, fontSize: 11, fontWeight: '700' },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
