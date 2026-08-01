export interface ThreatDatabaseShape {
  blacklistedNumbers: string[];
  spamKeywords: string[];
  scamUrls: string[];
  regexPatterns: string[];
}

const REQUIRED_ARRAY_KEYS: ReadonlyArray<keyof ThreatDatabaseShape> = [
  'blacklistedNumbers',
  'spamKeywords',
  'scamUrls',
  'regexPatterns',
];

export function parseThreatDatabase(value: unknown): ThreatDatabaseShape {
  if (!value || typeof value !== 'object') {
    throw new Error('Geçersiz tehdit veritabanı');
  }

  const candidate = value as Record<string, unknown>;
  const arraysAreValid = REQUIRED_ARRAY_KEYS.every(key => {
    const items = candidate[key];
    return Array.isArray(items)
      && items.length <= 1000
      && items.every(item =>
        typeof item === 'string'
        && item.trim().length > 0
        && item.length <= 200,
      );
  });

  if (!arraysAreValid) {
    throw new Error('Geçersiz tehdit veritabanı');
  }

  if (!(candidate.regexPatterns as string[]).every(isSafeRegexPattern)) {
    throw new Error('Geçersiz tehdit veritabanı');
  }

  return {
    blacklistedNumbers: (candidate.blacklistedNumbers as string[]).map(item => item.trim()),
    spamKeywords: (candidate.spamKeywords as string[]).map(item => item.trim()),
    scamUrls: (candidate.scamUrls as string[]).map(item => item.trim()),
    regexPatterns: (candidate.regexPatterns as string[]).map(item => item.trim()),
  };
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}
import { isSafeRegexPattern } from './regexPolicy';
