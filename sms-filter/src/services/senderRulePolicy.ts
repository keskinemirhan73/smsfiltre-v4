import type { FilterRule } from '../modules/FilterManager';

function normalizeSender(sender: string): string {
  return sender.trim().toLocaleLowerCase('tr-TR');
}

export function setSenderCategory(
  rules: readonly FilterRule[],
  sender: string,
  category: 'junk' | 'allowed',
  id = Date.now().toString(),
): FilterRule[] {
  const normalizedSender = normalizeSender(sender);
  const rulesWithoutSender = rules.filter(rule =>
    !(
      rule.matchTarget === 'sender' &&
      normalizeSender(rule.keyword) === normalizedSender
    ),
  );

  return [
    ...rulesWithoutSender,
    {
      id,
      keyword: sender,
      type: 'word',
      category,
      matchTarget: 'sender',
    },
  ];
}

export function setSenderWhitelistState(
  whitelist: readonly string[],
  sender: string,
  allowed: boolean,
): string[] {
  const normalizedSender = normalizeSender(sender);
  const withoutSender = whitelist.filter(
    value => normalizeSender(value) !== normalizedSender,
  );

  if (!allowed) return withoutSender;
  if (withoutSender.length !== whitelist.length) return [...whitelist];
  return [...whitelist, sender];
}
