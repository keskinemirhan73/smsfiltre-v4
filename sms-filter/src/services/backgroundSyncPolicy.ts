export type BackgroundSyncOutcome = 'new-data' | 'failed';

export function backgroundSyncOutcome(syncSucceeded: boolean): BackgroundSyncOutcome {
  return syncSucceeded ? 'new-data' : 'failed';
}
