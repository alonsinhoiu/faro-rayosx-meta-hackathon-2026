import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { BudgetGuard } from '../dist/db/budget-guard.js';

test('BudgetGuard: tracks spend in SQLite and enforces hard firewall limit', () => {
  const testDb = './data/test_ledger.db';
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

  const guard = new BudgetGuard(testDb, 1.00); // 1.00 USD hard limit

  assert.equal(guard.getTotalSpentUsd(), 0);
  assert.equal(guard.canSpend(0.50), true);

  // Record 0.60 call
  guard.recordUsage({
    model: 'muse-spark-1.3',
    endpoint: '/v1/responses',
    input_tokens: 1000,
    output_tokens: 500,
    estimated_cost_usd: 0.60,
  });

  assert.equal(guard.getTotalSpentUsd(), 0.60);
  assert.equal(guard.canSpend(0.30), true); // 0.60 + 0.30 = 0.90 <= 1.00 -> ok
  assert.equal(guard.canSpend(0.50), false); // 0.60 + 0.50 = 1.10 > 1.00 -> BLOCKED!

  // Clean up
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
});
