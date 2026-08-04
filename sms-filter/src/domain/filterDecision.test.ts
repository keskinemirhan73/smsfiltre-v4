import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFilterDecision,
  routeDecisionForPlatform,
} from './filterDecision';

test('gecerli karar risk puanini ve neden kodlarini tasir', () => {
  assert.deepEqual(createFilterDecision({
    category: 'junk',
    riskScore: 0.93,
    reasonCodes: ['KNOWN_SCAM_URL', 'URGENCY_LANGUAGE'],
    ruleVersion: 3,
  }), {
    category: 'junk',
    riskScore: 0.93,
    reasonCodes: ['KNOWN_SCAM_URL', 'URGENCY_LANGUAGE'],
    ruleVersion: 3,
  });
});

test('gecersiz veya bozuk karar veri kaybini onlemek icin allowed olur', () => {
  assert.deepEqual(createFilterDecision({
    category: 'hacked',
    riskScore: Number.NaN,
    reasonCodes: ['MESSAGE_BODY:secret'],
    ruleVersion: -1,
  }), {
    category: 'allowed',
    riskScore: 0,
    reasonCodes: ['CLASSIFIER_FALLBACK'],
    ruleVersion: 1,
  });
});

test('neden kodlari yalniz izin verilen sabit kodlardan olusur', () => {
  const decision = createFilterDecision({
    category: 'junk',
    riskScore: 2,
    reasonCodes: [
      'KNOWN_SCAM_URL',
      'KNOWN_SCAM_URL',
      'sender:+905551112233',
      'message:otp 123456',
    ],
    ruleVersion: 2,
  });

  assert.equal(decision.riskScore, 1);
  assert.deepEqual(decision.reasonCodes, ['KNOWN_SCAM_URL']);
});

test('Android ve iOS ayni karari platformun destekledigi hedefe cevirir', () => {
  const junk = createFilterDecision({
    category: 'junk',
    riskScore: 0.9,
    reasonCodes: ['KNOWN_SCAM_URL'],
    ruleVersion: 1,
  });
  const transaction = createFilterDecision({
    category: 'transaction',
    riskScore: 0.1,
    reasonCodes: ['TRANSACTION_LANGUAGE'],
    ruleVersion: 1,
  });

  assert.equal(routeDecisionForPlatform(junk, 'android'), 'spam');
  assert.equal(routeDecisionForPlatform(junk, 'ios'), 'junk');
  assert.equal(routeDecisionForPlatform(transaction, 'android'), 'transactions');
  assert.equal(routeDecisionForPlatform(transaction, 'ios'), 'transaction');
});
