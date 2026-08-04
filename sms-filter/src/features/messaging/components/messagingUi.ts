import { createThreadFromNative, type MessagingThread } from '../domain/models';

export type MessagingLocale = 'tr' | 'en';

export type ThreadCategory = 'inbox' | 'spam' | 'transaction' | 'promotion';

export type MessageDeliveryState = 'sending' | 'sent' | 'delivered' | 'failed';

export interface MessageThread {
  readonly id: string;
  readonly displayName: string;
  readonly address: string;
  readonly preview: string;
  readonly timestampLabel: string;
  readonly unreadCount: number;
  readonly category: ThreadCategory;
  readonly isMuted?: boolean;
}

export interface ConversationMessage {
  readonly id: string;
  readonly direction: 'incoming' | 'outgoing';
  readonly body: string;
  readonly timestampLabel: string;
  readonly deliveryState?: MessageDeliveryState;
}

export interface ValidatedSmsDraft {
  readonly recipientAddress: string;
  readonly body: string;
}

export interface SendSmsRequest extends ValidatedSmsDraft {
  readonly clientMessageId: string;
}

export interface SendSmsResult {
  readonly ok: boolean;
  readonly errorMessage?: string;
}

export const MAX_SMS_BODY_CODE_POINTS = 1600;
export const MAX_CONVERSATION_PAGE_SIZE = 100;
export const MAX_RENDERED_MESSAGE_CODE_POINTS = 8192;
const MAX_RAW_RECIPIENT_LENGTH = 64;
const DIALABLE_RECIPIENT = /^\+?[0-9]{3,15}$/;
const GSM_BASIC_CHARACTERS = new Set([
  ...'@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
]);
const GSM_EXTENSION_CHARACTERS = new Set(['^', '{', '}', '\\', '[', '~', ']', '|', '€']);
const DANGEROUS_BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const DELIVERY_STATES = new Set<MessageDeliveryState>(['sending', 'sent', 'delivered', 'failed']);

export function getAvatarLabel(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function canSendMessage(body: string, recipientAddress: string): boolean {
  try {
    createValidatedSmsDraft(body, recipientAddress);
    return true;
  } catch {
    return false;
  }
}

export function createValidatedSmsDraft(
  bodyInput: string,
  recipientInput: string,
): ValidatedSmsDraft {
  const recipientAddress = normalizeSmsRecipient(recipientInput);

  if (typeof bodyInput !== 'string') throw new Error('Invalid message body');
  const body = bodyInput.trim();
  if (body.length === 0
      || [...body].length > MAX_SMS_BODY_CODE_POINTS
      || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(body)
      || DANGEROUS_BIDI_CONTROLS.test(body)) {
    DANGEROUS_BIDI_CONTROLS.lastIndex = 0;
    throw new Error('Invalid message body');
  }
  DANGEROUS_BIDI_CONTROLS.lastIndex = 0;
  return Object.freeze({ recipientAddress, body });
}

export function normalizeSmsRecipient(recipientInput: string): string {
  if (typeof recipientInput !== 'string'
      || recipientInput.length > MAX_RAW_RECIPIENT_LENGTH
      || /[\p{Cc}\p{Cf}:;,/?#&=]/u.test(recipientInput)) {
    throw new Error('Invalid recipient address');
  }
  const recipientAddress = recipientInput.replace(/[\s().-]/g, '');
  if (!DIALABLE_RECIPIENT.test(recipientAddress)) {
    throw new Error('Invalid recipient address');
  }

  return recipientAddress;
}

export function createSendSmsRequest(
  draft: ValidatedSmsDraft,
  clientMessageId: string,
): SendSmsRequest {
  if (!/^[A-Za-z0-9._-]{8,128}$/.test(clientMessageId)) {
    throw new Error('Invalid client message id');
  }
  return Object.freeze({ ...draft, clientMessageId });
}

export function createClientMessageId(timestampMs: number, sequence: number): string {
  if (!Number.isSafeInteger(timestampMs) || timestampMs < 0
      || !Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error('Invalid client message id seed');
  }
  return `sms-${timestampMs.toString(36)}-${sequence.toString(36)}`;
}

export function estimateSmsSegments(body: string): number {
  if (body.length === 0) return 0;
  let septets = 0;
  for (const character of body) {
    if (GSM_BASIC_CHARACTERS.has(character)) septets += 1;
    else if (GSM_EXTENSION_CHARACTERS.has(character)) septets += 2;
    else return body.length <= 70 ? 1 : Math.ceil(body.length / 67);
  }
  return septets <= 160 ? 1 : Math.ceil(septets / 153);
}

export function getThreadAccessibilityLabel(
  thread: MessageThread,
  locale: MessagingLocale,
): string {
  const categoryLabels: Record<MessagingLocale, Record<ThreadCategory, string>> = {
    tr: {
      inbox: 'gelen kutusu',
      spam: 'spam',
      transaction: 'işlem',
      promotion: 'tanıtım',
    },
    en: {
      inbox: 'inbox',
      spam: 'spam',
      transaction: 'transaction',
      promotion: 'promotion',
    },
  };
  const parts = [thread.displayName, categoryLabels[locale][thread.category]];
  if (thread.unreadCount > 0) {
    parts.push(
      locale === 'tr'
        ? `${thread.unreadCount} okunmamış mesaj`
        : `${thread.unreadCount} unread messages`,
    );
  }
  return parts.join(', ');
}

export function createMessageThreadViewModel(
  thread: MessagingThread,
  timestampLabel: string,
  options: Readonly<{ showSensitivePreview?: boolean }> = {},
): MessageThread {
  if (typeof timestampLabel !== 'string' || timestampLabel.length > 64
      || /[\p{Cc}\p{Cf}]/u.test(timestampLabel)) {
    throw new Error('Thread must come from the validated domain boundary');
  }
  const validated = createThreadFromNative(thread);
  const category: ThreadCategory = validated.bucket === 'transactions'
    ? 'transaction'
    : validated.bucket === 'promotions'
      ? 'promotion'
      : validated.bucket;
  return Object.freeze({
    id: validated.id,
    displayName: validated.participantLabel,
    address: validated.participantAddress,
    preview: options.showSensitivePreview ? validated.lastMessagePreview : 'Yeni mesaj',
    timestampLabel,
    unreadCount: validated.unreadCount,
    category,
  });
}

export function createConversationMessagePageFromNative(input: unknown): readonly ConversationMessage[] {
  if (!Array.isArray(input) || input.length > MAX_CONVERSATION_PAGE_SIZE) {
    throw new Error('Invalid conversation message page');
  }
  const messages = input.map((value): ConversationMessage => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid conversation message');
    }
    const record = value as Record<string, unknown>;
    if (typeof record.id !== 'string' || record.id.length < 1 || record.id.length > 128
        || /[\p{Cc}\p{Cf}]/u.test(record.id)) {
      throw new Error('Invalid conversation message id');
    }
    if (record.direction !== 'incoming' && record.direction !== 'outgoing') {
      throw new Error('Invalid conversation message direction');
    }
    if (typeof record.body !== 'string' || [...record.body].length > MAX_RENDERED_MESSAGE_CODE_POINTS) {
      throw new Error('Invalid conversation message body');
    }
    if (typeof record.timestampLabel !== 'string' || record.timestampLabel.length > 64
        || /[\p{Cc}\p{Cf}]/u.test(record.timestampLabel)) {
      throw new Error('Invalid conversation message timestamp');
    }
    if (record.deliveryState !== undefined
        && !DELIVERY_STATES.has(record.deliveryState as MessageDeliveryState)) {
      throw new Error('Invalid conversation delivery state');
    }
    return Object.freeze({
      id: record.id,
      direction: record.direction,
      body: record.body.replace(DANGEROUS_BIDI_CONTROLS, ''),
      timestampLabel: record.timestampLabel,
      ...(record.deliveryState === undefined
        ? {}
        : { deliveryState: record.deliveryState as MessageDeliveryState }),
    });
  });
  return Object.freeze(messages);
}
