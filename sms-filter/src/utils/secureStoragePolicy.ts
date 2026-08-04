export const LEGACY_PLAIN_PREFIX = 'plain:v1:';

export type StoredValueKind =
  | 'encrypted-v2'
  | 'legacy-plain'
  | 'legacy-json'
  | 'legacy-encrypted';

export function classifyStoredValue(value: string): StoredValueKind {
  if (value.startsWith('v2:')) return 'encrypted-v2';
  if (value.startsWith(LEGACY_PLAIN_PREFIX)) return 'legacy-plain';
  if (value.startsWith('{') || value.startsWith('[')) return 'legacy-json';
  return 'legacy-encrypted';
}
