import {
  createFilterDecision,
  routeDecisionForPlatform,
  type AndroidMessageBucket,
  type FilterDecision,
  type FilterReasonCode,
} from '../../../domain/filterDecision';

export const MAX_MESSAGE_PREVIEW_LENGTH = 120;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 30;

declare const sensitivePreviewBrand: unique symbol;
export type SensitiveMessagePreview = string & {
  readonly [sensitivePreviewBrand]: true;
};

const MAX_ID_LENGTH = 128;
const MAX_LABEL_LENGTH = 160;
const MAX_CURSOR_LENGTH = 512;
const MESSAGE_BODY_FIELDS = ['body', 'text', 'messageBody', 'content'] as const;

export type MessageDirection = 'incoming' | 'outgoing';

export type ImmutableFilterDecision = Readonly<
  Omit<FilterDecision, 'reasonCodes'> & {
    readonly reasonCodes: readonly FilterReasonCode[];
  }
>;

export interface MessageClassification {
  readonly decision: ImmutableFilterDecision;
  readonly bucket: AndroidMessageBucket;
  readonly classifiedAtMs: number;
}

export interface MessagingMessage {
  readonly id: string;
  readonly threadId: string;
  readonly senderLabel: string;
  readonly direction: MessageDirection;
  readonly timestampMs: number;
  readonly preview: SensitiveMessagePreview;
  readonly isRead: boolean;
  readonly classification: MessageClassification;
}

export interface MessagingThread {
  readonly id: string;
  readonly participantLabel: string;
  readonly participantAddress: string;
  readonly lastMessageId: string;
  readonly lastMessageAtMs: number;
  readonly lastMessagePreview: SensitiveMessagePreview;
  readonly unreadCount: number;
  readonly messageCount: number;
  readonly bucket: AndroidMessageBucket;
  readonly classification: MessageClassification;
}

export interface PageRequest {
  readonly cursor: string | null;
  readonly limit: number;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export type MessagePage = Page<MessagingMessage>;
export type ThreadPage = Page<MessagingThread>;

export class MessagingDomainValidationError extends Error {
  constructor(field: string, reason: string) {
    super(`Invalid ${field}: ${reason}`);
    this.name = 'MessagingDomainValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new MessagingDomainValidationError(field, 'expected an object');
  }
  return value;
}

function requireSafeString(
  value: unknown,
  field: string,
  maximumLength: number,
): string {
  if (typeof value !== 'string') {
    throw new MessagingDomainValidationError(field, 'expected a string');
  }

  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maximumLength) {
    throw new MessagingDomainValidationError(
      field,
      `expected 1-${maximumLength} characters`,
    );
  }
  if (/[\p{Cc}\p{Cf}]/u.test(normalized)) {
    throw new MessagingDomainValidationError(field, 'control or format characters are not allowed');
  }
  return normalized;
}

function requireTimestamp(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new MessagingDomainValidationError(field, 'expected a non-negative integer');
  }
  return value as number;
}

function requireCount(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new MessagingDomainValidationError(field, 'expected a non-negative integer');
  }
  return value as number;
}

function assertNoMessageBody(input: Record<string, unknown>): void {
  const sensitiveField = MESSAGE_BODY_FIELDS.find((field) => field in input);
  if (sensitiveField) {
    throw new MessagingDomainValidationError(
      sensitiveField,
      'message body fields must not cross the domain boundary',
    );
  }
}

function freezeFilterDecision(decision: FilterDecision): ImmutableFilterDecision {
  return Object.freeze({
    ...decision,
    reasonCodes: Object.freeze([...decision.reasonCodes]),
  });
}

function parseStrictDecision(input: unknown): ImmutableFilterDecision {
  const record = requireRecord(input, 'classification.decision');
  const parsed = createFilterDecision(record);

  const reasonCodesAreExact = Array.isArray(record.reasonCodes)
    && record.reasonCodes.length === parsed.reasonCodes.length
    && record.reasonCodes.every((reason, index) => reason === parsed.reasonCodes[index]);
  const isExact = record.category === parsed.category
    && record.riskScore === parsed.riskScore
    && record.ruleVersion === parsed.ruleVersion
    && reasonCodesAreExact;

  if (!isExact) {
    throw new MessagingDomainValidationError(
      'classification.decision',
      'decision does not match the filter decision contract',
    );
  }

  return freezeFilterDecision(parsed);
}

function parseClassification(input: unknown): MessageClassification {
  const record = requireRecord(input, 'classification');
  const decision = parseStrictDecision(record.decision);
  const classifiedAtMs = requireTimestamp(
    record.classifiedAtMs,
    'classification.classifiedAtMs',
  );

  return Object.freeze({
    decision,
    bucket: routeDecisionForPlatform(decision as FilterDecision, 'android'),
    classifiedAtMs,
  });
}

function parseCursor(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  return requireSafeString(value, field, MAX_CURSOR_LENGTH);
}

export function toSafeMessagePreview(value: unknown): SensitiveMessagePreview {
  if (typeof value !== 'string') {
    throw new MessagingDomainValidationError('preview', 'expected a string');
  }

  const normalized = value
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .replace(/\p{Cf}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const characters = [...normalized];

  if (characters.length <= MAX_MESSAGE_PREVIEW_LENGTH) {
    return normalized as SensitiveMessagePreview;
  }
  return `${characters.slice(0, MAX_MESSAGE_PREVIEW_LENGTH - 1).join('')}…` as SensitiveMessagePreview;
}

export function createMessageFromNative(input: unknown): MessagingMessage {
  const record = requireRecord(input, 'message');
  assertNoMessageBody(record);

  const direction = record.direction;
  if (direction !== 'incoming' && direction !== 'outgoing') {
    throw new MessagingDomainValidationError(
      'direction',
      'expected incoming or outgoing',
    );
  }
  if (typeof record.isRead !== 'boolean') {
    throw new MessagingDomainValidationError('isRead', 'expected a boolean');
  }

  return Object.freeze({
    id: requireSafeString(record.id, 'id', MAX_ID_LENGTH),
    threadId: requireSafeString(record.threadId, 'threadId', MAX_ID_LENGTH),
    senderLabel: requireSafeString(record.senderLabel, 'senderLabel', MAX_LABEL_LENGTH),
    direction,
    timestampMs: requireTimestamp(record.timestampMs, 'timestampMs'),
    preview: toSafeMessagePreview(record.preview),
    isRead: record.isRead,
    classification: parseClassification(record.classification),
  });
}

export function createThreadFromNative(input: unknown): MessagingThread {
  const record = requireRecord(input, 'thread');
  assertNoMessageBody(record);
  if ('lastMessageBody' in record) {
    throw new MessagingDomainValidationError(
      'lastMessageBody',
      'message body fields must not cross the domain boundary',
    );
  }

  const classification = parseClassification(record.classification);
  return Object.freeze({
    id: requireSafeString(record.id, 'id', MAX_ID_LENGTH),
    participantLabel: requireSafeString(
      record.participantLabel,
      'participantLabel',
      MAX_LABEL_LENGTH,
    ),
    participantAddress: requireSafeString(
      record.participantAddress,
      'participantAddress',
      MAX_LABEL_LENGTH,
    ),
    lastMessageId: requireSafeString(record.lastMessageId, 'lastMessageId', MAX_ID_LENGTH),
    lastMessageAtMs: requireTimestamp(record.lastMessageAtMs, 'lastMessageAtMs'),
    lastMessagePreview: toSafeMessagePreview(record.lastMessagePreview),
    unreadCount: requireCount(record.unreadCount, 'unreadCount'),
    messageCount: requireCount(record.messageCount, 'messageCount'),
    bucket: classification.bucket,
    classification,
  });
}

export function createPageRequest(input: unknown = {}): PageRequest {
  const record = requireRecord(input, 'pageRequest');
  const limit = record.limit === undefined ? DEFAULT_PAGE_SIZE : record.limit;
  if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > MAX_PAGE_SIZE) {
    throw new MessagingDomainValidationError(
      'limit',
      `expected an integer between 1 and ${MAX_PAGE_SIZE}`,
    );
  }

  return Object.freeze({
    cursor: parseCursor(record.cursor, 'cursor'),
    limit: limit as number,
  });
}

function createPageFromNative<T>(
  input: unknown,
  parseItem: (item: unknown) => T,
): Page<T> {
  const record = requireRecord(input, 'page');
  if (!Array.isArray(record.items)) {
    throw new MessagingDomainValidationError('page.items', 'expected an array');
  }
  if (record.items.length > MAX_PAGE_SIZE) {
    throw new MessagingDomainValidationError(
      'page.items',
      `page cannot contain more than ${MAX_PAGE_SIZE} items`,
    );
  }

  const items = Object.freeze(record.items.map((item) => parseItem(item)));
  return Object.freeze({
    items,
    nextCursor: parseCursor(record.nextCursor, 'nextCursor'),
  });
}

export function createMessagePageFromNative(input: unknown): MessagePage {
  return createPageFromNative(input, createMessageFromNative);
}

export function createThreadPageFromNative(input: unknown): ThreadPage {
  return createPageFromNative(input, createThreadFromNative);
}
