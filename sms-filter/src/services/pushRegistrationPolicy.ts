export interface PushRegistrationPayload {
  token: string;
  platform: string;
  deviceName: string;
}

interface RegistrationResponse {
  ok: boolean;
  status: number;
}

interface PushRegistrationDependencies {
  endpoints: readonly string[];
  request: (
    url: string,
    init: {
      method: 'POST';
      headers: { 'Content-Type': 'application/json' };
      body: string;
    },
  ) => Promise<RegistrationResponse>;
  retryDelaysMs?: readonly number[];
  sleep?: (delayMs: number) => Promise<void>;
}

export interface PushRegistrationResult {
  ok: boolean;
  endpoint?: string;
  attempts: number;
}

const defaultSleep = (delayMs: number) =>
  new Promise<void>(resolve => setTimeout(resolve, delayMs));

export async function registerPushTokenReliably(
  payload: PushRegistrationPayload,
  {
    endpoints,
    request,
    retryDelaysMs = [300, 1200],
    sleep = defaultSleep,
  }: PushRegistrationDependencies,
): Promise<PushRegistrationResult> {
  const body = JSON.stringify(payload);
  let attempts = 0;

  for (const endpoint of endpoints) {
    for (let attemptIndex = 0; attemptIndex <= retryDelaysMs.length; attemptIndex += 1) {
      attempts += 1;
      try {
        const response = await request(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        if (response.ok) return { ok: true, endpoint, attempts };
        if (response.status >= 400 && response.status < 500) break;
      } catch {
        // Network and 5xx failures use the same bounded retry policy.
      }

      const retryDelay = retryDelaysMs[attemptIndex];
      if (retryDelay !== undefined) await sleep(retryDelay);
    }
  }

  return { ok: false, attempts };
}
