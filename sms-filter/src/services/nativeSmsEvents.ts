export type NativeSmsStatus = 'suspicious' | 'transaction' | 'promotion' | 'allowed';

export interface NativeSmsEvent {
  id: string;
  sender: string;
  preview: string;
  status: NativeSmsStatus;
  timestamp: number;
}

interface HistoryEntry {
  id: string;
  sender: string;
  preview: string;
  status: 'blocked' | 'transaction' | 'promotion' | 'allowed';
  category: string;
  timestamp: number;
}

interface StatsSnapshot {
  blockedCount: number;
  analyzedCount: number;
  transactionCount: number;
  promotionCount: number;
}

const VALID_STATUSES = new Set<NativeSmsStatus>([
  'suspicious', 'transaction', 'promotion', 'allowed',
]);

function isNativeSmsEvent(value: unknown): value is NativeSmsEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<NativeSmsEvent>;
  return (
    typeof event.id === 'string' && event.id.length > 0 && event.id.length <= 128 &&
    typeof event.sender === 'string' && event.sender.length <= 64 &&
    typeof event.preview === 'string' && event.preview.length <= 160 &&
    typeof event.status === 'string' && VALID_STATUSES.has(event.status as NativeSmsStatus) &&
    typeof event.timestamp === 'number' && Number.isFinite(event.timestamp) && event.timestamp > 0
  );
}

export function parseNativeSmsEvents(rawValue: string | null): NativeSmsEvent[] {
  if (!rawValue) return [];
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-50).filter(isNativeSmsEvent);
  } catch {
    return [];
  }
}

export function parseNativeSmsEventQueues(
  rawValues: Array<string | null>,
): NativeSmsEvent[] {
  const seenIds = new Set<string>();
  return rawValues
    .flatMap(rawValue => parseNativeSmsEvents(rawValue))
    .filter(event => {
      if (seenIds.has(event.id)) return false;
      seenIds.add(event.id);
      return true;
    });
}

function historyStatus(status: NativeSmsStatus): HistoryEntry['status'] {
  return status === 'suspicious' ? 'blocked' : status;
}

export function mergeNativeSmsEvents(
  existingHistory: HistoryEntry[],
  existingStats: StatsSnapshot,
  processedIds: string[],
  events: NativeSmsEvent[],
) {
  const processedSet = new Set(processedIds);
  const newEvents = events
    .filter(event => !processedSet.has(event.id))
    .sort((left, right) => right.timestamp - left.timestamp);

  const history = [
    ...newEvents.map(event => ({
      id: event.id,
      sender: event.sender,
      preview: event.preview,
      status: historyStatus(event.status),
      category: event.status,
      timestamp: event.timestamp,
    })),
    ...existingHistory,
  ].slice(0, 50);

  const stats = newEvents.reduce<StatsSnapshot>((current, event) => ({
    blockedCount: current.blockedCount + (event.status === 'suspicious' ? 1 : 0),
    analyzedCount: current.analyzedCount + 1,
    transactionCount: current.transactionCount + (event.status === 'transaction' ? 1 : 0),
    promotionCount: current.promotionCount + (event.status === 'promotion' ? 1 : 0),
  }), { ...existingStats });

  return {
    history,
    stats,
    processedIds: [
      ...newEvents.map(event => event.id),
      ...processedIds,
    ].slice(0, 200),
    importedCount: newEvents.length,
  };
}
