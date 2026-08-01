const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*{]/;
const BACKREFERENCE = /\\[1-9]/;

export function isSafeRegexPattern(pattern: string): boolean {
  if (pattern.length < 1 || pattern.length > 200) return false;
  if (NESTED_QUANTIFIER.test(pattern) || BACKREFERENCE.test(pattern)) return false;

  try {
    new RegExp(pattern, 'i');
    return true;
  } catch {
    return false;
  }
}
