export interface PublicJsonRequest {
  headers: { 'Content-Type': string };
  body: string;
}

export function createPublicJsonRequest(payload: unknown): PublicJsonRequest {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
