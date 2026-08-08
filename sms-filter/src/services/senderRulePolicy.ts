import type { FilterRule } from '../modules/FilterManager';

function normalizeSender(sender: string): string {
  return sender.trim().toLocaleLowerCase('tr-TR');
}

const UNSAFE_SENDER_CHARACTERS = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;

export function parseSenderRuleInput(value: string): string | null {
  const sender = value.trim();
  if (!sender || sender.length > 64 || UNSAFE_SENDER_CHARACTERS.test(sender)) {
    return null;
  }
  return sender;
}

export function senderRuleMatches(sender: string, keyword: string): boolean {
  return normalizeSender(sender) === normalizeSender(keyword);
}

export function setSenderCategory(
  rules: readonly FilterRule[],
  sender: string,
  category: FilterRule['category'],
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
    {
      id,
      keyword: sender,
      type: 'word',
      category,
      matchTarget: 'sender',
      matchMode: 'exact',
    },
    ...rulesWithoutSender,
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
