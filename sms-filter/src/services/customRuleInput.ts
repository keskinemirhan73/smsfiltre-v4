import { isSafeRegexPattern } from './regexPolicy';

const REGEX_SIGNAL = /[\[\]\\(){}^$|]/;

export function parseCustomRuleKeyword(value: string): {
  keyword: string;
  type: 'word' | 'regex';
} | null {
  const keyword = value.trim();
  if (!keyword || keyword.length > 200) return null;

  const type = REGEX_SIGNAL.test(keyword) ? 'regex' : 'word';
  if (type === 'regex' && !isSafeRegexPattern(keyword)) return null;
  return { keyword, type };
}
