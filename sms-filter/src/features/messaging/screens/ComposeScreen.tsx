import React, { useRef, useState } from 'react';
import { ArrowLeft, LockKeyhole, Send, UserRound } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import {
  MessagingScreenShell,
  messagingChromeStyles,
} from '../components/MessagingScreenShell';
import {
  canSendMessage,
  createClientMessageId,
  createSendSmsRequest,
  createValidatedSmsDraft,
  estimateSmsSegments,
  normalizeSmsRecipient,
  type MessagingLocale,
  type SendSmsRequest,
  type SendSmsResult,
} from '../components/messagingUi';

interface ComposeScreenProps {
  locale: MessagingLocale;
  initialRecipient?: string;
  onBack: () => void;
  onSend: (request: SendSmsRequest) => Promise<SendSmsResult>;
  onPickRecipient?: () => Promise<string | null>;
}

export function ComposeScreen({
  locale,
  initialRecipient = '',
  onBack,
  onSend,
  onPickRecipient,
}: ComposeScreenProps) {
  const theme = useAppTheme();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const sequence = useRef(0);
  const sendingLock = useRef(false);
  const pendingRequest = useRef<Readonly<{ key: string; request: SendSmsRequest }> | null>(null);
  const labels = locale === 'tr'
    ? {
        title: 'Yeni mesaj',
        subtitle: 'Güvenli SMS oluştur',
        back: 'Geri',
        recipient: 'Alıcı',
        recipientPlaceholder: 'Telefon numarası veya gönderen',
        pickRecipient: 'Rehberden alıcı seç',
        message: 'Mesaj',
        messagePlaceholder: 'Mesajını yaz…',
        privacy: 'Mesaj içeriği gönderimden önce cihazından ayrılmaz.',
        send: 'Mesajı gönder',
        sending: 'Gönderiliyor…',
        sendFailed: 'Mesaj gönderilemedi. Taslağın korundu.',
        segments: 'SMS parçası',
      }
    : {
        title: 'New message',
        subtitle: 'Compose a secure SMS',
        back: 'Back',
        recipient: 'Recipient',
        recipientPlaceholder: 'Phone number or sender',
        pickRecipient: 'Choose a contact',
        message: 'Message',
        messagePlaceholder: 'Write your message…',
        privacy: 'Message content stays on your device until it is sent.',
        send: 'Send message',
        sending: 'Sending…',
        sendFailed: 'Message could not be sent. Your draft was kept.',
        segments: 'SMS segments',
      };
  const sendEnabled = canSendMessage(body, recipient);

  const submit = async () => {
    if (!sendEnabled || sendingLock.current) return;
    sendingLock.current = true;
    setIsSending(true);
    setSendError('');
    try {
      const draft = createValidatedSmsDraft(body, recipient);
      const key = `${draft.recipientAddress}\u0000${draft.body}`;
      if (pendingRequest.current?.key !== key) {
        sequence.current += 1;
        pendingRequest.current = Object.freeze({
          key,
          request: createSendSmsRequest(
            draft,
            createClientMessageId(Date.now(), sequence.current),
          ),
        });
      }
      const request = pendingRequest.current.request;
      const result = await onSend(request);
      if (result.ok) {
        pendingRequest.current = null;
        setBody('');
      }
      else setSendError(result.errorMessage || labels.sendFailed);
    } catch {
      setSendError(labels.sendFailed);
    } finally {
      sendingLock.current = false;
      setIsSending(false);
    }
  };

  const pickRecipient = async () => {
    if (!onPickRecipient || isSending) return;
    try {
      const selected = await onPickRecipient();
      if (selected) setRecipient(normalizeSmsRecipient(selected));
    } catch {
      setSendError(labels.sendFailed);
    }
  };
  const segmentCount = estimateSmsSegments(body);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MessagingScreenShell
        title={labels.title}
        subtitle={labels.subtitle}
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
      >
        <View style={styles.content}>
          <Text style={[styles.label, { color: theme.text }]}>{labels.recipient}</Text>
          <View
            style={[
              styles.recipientField,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <UserRound size={20} color={theme.primary} />
            <TextInput
              accessibilityLabel={labels.recipient}
              value={recipient}
              onChangeText={setRecipient}
              placeholder={labels.recipientPlaceholder}
              placeholderTextColor={theme.textMuted}
              style={[styles.recipientInput, { color: theme.text }]}
              autoCapitalize="none"
              keyboardType="phone-pad"
              editable={!isSending}
            />
            {onPickRecipient ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={labels.pickRecipient}
                onPress={pickRecipient}
                style={[styles.contactButton, { backgroundColor: theme.primaryGlow }]}
              >
                <UserRound size={18} color={theme.primary} />
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.label, styles.messageLabel, { color: theme.text }]}>
            {labels.message}
          </Text>
          <View
            style={[
              styles.messageField,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TextInput
              accessibilityLabel={labels.message}
              value={body}
              onChangeText={setBody}
              placeholder={labels.messagePlaceholder}
              placeholderTextColor={theme.textMuted}
              style={[styles.messageInput, { color: theme.text }]}
              multiline
              maxLength={1600}
              textAlignVertical="top"
              editable={!isSending}
            />
            <Text style={[styles.characterCount, { color: theme.textMuted }]}>
              {[...body].length}/1600 · {segmentCount} {labels.segments}
            </Text>
          </View>

          {sendError ? <Text style={[styles.errorText, { color: theme.danger }]}>{sendError}</Text> : null}

          <View style={[styles.privacyCard, { backgroundColor: `${theme.secondary}10` }]}>
            <LockKeyhole size={17} color={theme.secondary} />
            <Text style={[styles.privacyText, { color: theme.secondary }]}>{labels.privacy}</Text>
          </View>

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
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Send size={20} color={sendEnabled && !isSending ? '#FFFFFF' : theme.textMuted} />
            <Text style={[styles.sendText, { color: sendEnabled && !isSending ? '#FFFFFF' : theme.textMuted }]}> 
              {isSending ? labels.sending : labels.send}
            </Text>
          </Pressable>
        </View>
      </MessagingScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: spacing.lg },
  label: { marginBottom: spacing.sm, fontSize: 13, fontWeight: '900' },
  recipientField: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  recipientInput: { flex: 1, height: '100%', fontSize: 15 },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageLabel: { marginTop: spacing.lg },
  messageField: {
    minHeight: 180,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  messageInput: { flex: 1, minHeight: 130, fontSize: 15, lineHeight: 22 },
  characterCount: { alignSelf: 'flex-end', marginTop: spacing.sm, fontSize: 11, fontWeight: '700' },
  errorText: { marginTop: spacing.sm, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  sendButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
    borderRadius: radii.lg,
  },
  sendText: { fontSize: 16, fontWeight: '900' },
});
