export interface CommunityRule {
  keyword: string;
  type: 'word' | 'number' | 'regex';
}

const ALLOWED_TYPES = new Set<CommunityRule['type']>(['word', 'number', 'regex']);

export function parseCommunityRules(value: unknown): CommunityRule[] {
  if (!Array.isArray(value)) {
    throw new Error('Geçersiz topluluk kuralları');
  }

  const rules = value.map(item => {
    if (!item || typeof item !== 'object') {
      throw new Error('Geçersiz topluluk kuralları');
    }

    const candidate = item as Record<string, unknown>;
    const keyword = typeof candidate.keyword === 'string' ? candidate.keyword.trim() : '';
    const type = candidate.type;
    if (
      keyword.length < 2
      || keyword.length > 120
      || !ALLOWED_TYPES.has(type as CommunityRule['type'])
      || (type === 'regex' && !isSafeRegexPattern(keyword))
    ) {
      throw new Error('Geçersiz topluluk kuralları');
    }

    return { keyword, type: type as CommunityRule['type'] };
  });

  return rules.slice(0, 500);
}
import { isSafeRegexPattern } from './regexPolicy';
