import { parseSenderRuleInput } from './senderRulePolicy';

export type PendingSenderCategory = 'junk' | 'allowed' | 'transaction' | 'promotion';

export interface PendingSenderCorrection {
  id: string;
  sender: string | null;
  category: PendingSenderCategory;
  timestamp: number;
}

const MAX_PENDING_CORRECTIONS = 50;
const VALID_CATEGORIES = new Set<PendingSenderCategory>([
  'junk', 'allowed', 'transaction', 'promotion',
]);

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9-]{1,128}$/.test(value);
}

function isPendingSenderCorrection(value: unknown): value is PendingSenderCorrection {
  if (!value || typeof value !== 'object') return false;
  const correction = value as Partial<PendingSenderCorrection>;
  return (
    isSafeId(correction.id) &&
    (correction.sender === null || (
      typeof correction.sender === 'string' &&
      parseSenderRuleInput(correction.sender) === correction.sender
    )) &&
    typeof correction.category === 'string' &&
    VALID_CATEGORIES.has(correction.category as PendingSenderCategory) &&
    typeof correction.timestamp === 'number' &&
    Number.isFinite(correction.timestamp) &&
    correction.timestamp > 0
  );
}

export function parseNativeSenderOverride(rawValue: string | null): PendingSenderCorrection | null {
  if (!rawValue) return null;
  try {
    const parsed: unknown = JSON.parse(rawValue);
    return isPendingSenderCorrection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseNativeSenderOverrideQueue(rawValue: string | null): PendingSenderCorrection[] {
  if (!rawValue) return [];
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    const byId = new Map<string, PendingSenderCorrection>();
    parsed.slice(-MAX_PENDING_CORRECTIONS).forEach(value => {
      if (isPendingSenderCorrection(value)) byId.set(value.id, { ...value });
    });
    return [...byId.values()];
  } catch {
    return [];
  }
}

export function filterUnprocessedSenderCorrections(
  corrections: readonly PendingSenderCorrection[],
  processedIds: readonly string[],
): PendingSenderCorrection[] {
  const processed = new Set(processedIds.filter(isSafeId));
  return corrections
    .filter(isPendingSenderCorrection)
    .filter(correction => !processed.has(correction.id))
    .map(correction => ({ ...correction }));
}

export function parsePendingSenderOverrideIds(rawValue: string | null): string[] {
  if (!rawValue) return [];
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(isSafeId))].slice(-MAX_PENDING_CORRECTIONS);
  } catch {
    return [];
  }
}

export function mergePendingSenderCorrections(
  existing: readonly PendingSenderCorrection[],
  incoming: readonly PendingSenderCorrection[],
): PendingSenderCorrection[] {
  const byId = new Map<string, PendingSenderCorrection>();
  [...existing, ...incoming]
    .filter(isPendingSenderCorrection)
    .forEach(correction => byId.set(correction.id, { ...correction }));

  const seenSenders = new Set<string>();
  return [...byId.values()]
    .sort((left, right) => right.timestamp - left.timestamp)
    .filter(correction => {
      const normalizedSender = correction.sender
        ? correction.sender.trim().toLocaleLowerCase('tr-TR')
        : `missing:${correction.id}`;
      if (seenSenders.has(normalizedSender)) return false;
      seenSenders.add(normalizedSender);
      return true;
    })
    .slice(0, MAX_PENDING_CORRECTIONS);
}
