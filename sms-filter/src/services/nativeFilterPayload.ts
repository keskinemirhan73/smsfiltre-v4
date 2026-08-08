import { isSafeRegexPattern } from './regexPolicy';

interface NativeRule {
  id: string;
  keyword: string;
  type: 'word' | 'regex';
  category: string;
  matchTarget: string;
  matchMode?: 'exact' | 'contains';
}

interface NativeThreatDatabase {
  blacklistedNumbers: string[];
  spamKeywords: string[];
  scamUrls: string[];
  regexPatterns?: string[];
}

type NativeThreatType = 'number' | 'word' | 'regex';

const VALID_CATEGORIES = new Set(['junk', 'transaction', 'promotion', 'allowed']);
const VALID_MATCH_TARGETS = new Set(['sender', 'content', 'both']);

function isValidNativeRule(rule: NativeRule): boolean {
  const keyword = rule.keyword.trim();
  if (!keyword || keyword.length > 200) return false;
  if (!VALID_CATEGORIES.has(rule.category) || !VALID_MATCH_TARGETS.has(rule.matchTarget)) {
    return false;
  }
  return rule.type === 'word' || (
    rule.type === 'regex' && isSafeRegexPattern(keyword)
  );
}

function nativeThreats(values: string[], type: NativeThreatType) {
  return values
    .map(value => value.trim())
    .filter(Boolean)
    .map(keyword => ({ keyword, type }));
}

export function buildNativeFilterPayload(
  rules: NativeRule[],
  settings: object,
  threatDatabase: NativeThreatDatabase,
): string {
  return JSON.stringify({
    schemaVersion: 1,
    rules: rules.filter(isValidNativeRule).map(rule => ({
      ...rule,
      keyword: rule.keyword.trim(),
    })),
    settings,
    threatDb: [
      ...nativeThreats(threatDatabase.blacklistedNumbers, 'number'),
      ...nativeThreats(threatDatabase.spamKeywords, 'word'),
      ...nativeThreats(threatDatabase.scamUrls, 'word'),
      ...nativeThreats(threatDatabase.regexPatterns ?? [], 'regex'),
    ],
  });
}
