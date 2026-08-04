export type FilterCategory = 'allowed' | 'junk' | 'transaction' | 'promotion';

export type FilterReasonCode =
  | 'CLASSIFIER_FALLBACK'
  | 'KNOWN_SCAM_URL'
  | 'KNOWN_SPAM_SENDER'
  | 'USER_BLOCK_RULE'
  | 'SUSPICIOUS_NUMBER'
  | 'FOREIGN_ALPHABET'
  | 'URGENCY_LANGUAGE'
  | 'FINANCIAL_FRAUD_LANGUAGE'
  | 'GAMBLING_LANGUAGE'
  | 'TRANSACTION_LANGUAGE'
  | 'PROMOTION_LANGUAGE'
  | 'LOCAL_MODEL_SCORE';

export interface FilterDecision {
  category: FilterCategory;
  riskScore: number;
  reasonCodes: FilterReasonCode[];
  ruleVersion: number;
}

export type AndroidMessageBucket = 'inbox' | 'spam' | 'transactions' | 'promotions';
export type IosMessageAction = FilterCategory;

const CATEGORIES = new Set<FilterCategory>([
  'allowed',
  'junk',
  'transaction',
  'promotion',
]);

const REASON_CODES = new Set<FilterReasonCode>([
  'CLASSIFIER_FALLBACK',
  'KNOWN_SCAM_URL',
  'KNOWN_SPAM_SENDER',
  'USER_BLOCK_RULE',
  'SUSPICIOUS_NUMBER',
  'FOREIGN_ALPHABET',
  'URGENCY_LANGUAGE',
  'FINANCIAL_FRAUD_LANGUAGE',
  'GAMBLING_LANGUAGE',
  'TRANSACTION_LANGUAGE',
  'PROMOTION_LANGUAGE',
  'LOCAL_MODEL_SCORE',
]);

const FALLBACK_DECISION: FilterDecision = {
  category: 'allowed',
  riskScore: 0,
  reasonCodes: ['CLASSIFIER_FALLBACK'],
  ruleVersion: 1,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createFilterDecision(input: unknown): FilterDecision {
  if (!isRecord(input) || !CATEGORIES.has(input.category as FilterCategory)) {
    return { ...FALLBACK_DECISION, reasonCodes: [...FALLBACK_DECISION.reasonCodes] };
  }

  const riskScore = typeof input.riskScore === 'number' && Number.isFinite(input.riskScore)
    ? Math.min(1, Math.max(0, input.riskScore))
    : 0;
  const ruleVersion = typeof input.ruleVersion === 'number'
    && Number.isInteger(input.ruleVersion)
    && input.ruleVersion > 0
    ? input.ruleVersion
    : 1;
  const reasonCodes = Array.isArray(input.reasonCodes)
    ? [...new Set(input.reasonCodes.filter(
      (code): code is FilterReasonCode => typeof code === 'string'
        && REASON_CODES.has(code as FilterReasonCode),
    ))]
    : [];

  return {
    category: input.category as FilterCategory,
    riskScore,
    reasonCodes,
    ruleVersion,
  };
}

export function routeDecisionForPlatform(
  decision: FilterDecision,
  platform: 'android',
): AndroidMessageBucket;
export function routeDecisionForPlatform(
  decision: FilterDecision,
  platform: 'ios',
): IosMessageAction;
export function routeDecisionForPlatform(
  decision: FilterDecision,
  platform: 'android' | 'ios',
): AndroidMessageBucket | IosMessageAction {
  if (platform === 'ios') return decision.category;
  if (decision.category === 'junk') return 'spam';
  if (decision.category === 'transaction') return 'transactions';
  if (decision.category === 'promotion') return 'promotions';
  return 'inbox';
}
