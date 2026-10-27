import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { MetaModelClient } from '../dist/meta/client.js';
import { BudgetGuard } from '../dist/db/budget-guard.js';

test('MetaModelClient: respects BudgetGuard hard limit and enforces spend firewall', async () => {
  const testDb = './data/test_meta_guard.db';
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

  const guard = new BudgetGuard(testDb, 0.005); // only 0.5 cents limit
  // Fake spent 0.005 to lock it
  guard.recordUsage({
    model: 'muse-spark-1.3',
    endpoint: '/v1/responses',
    estimated_cost_usd: 0.005,
  });

  const client = new MetaModelClient({
    budgetGuard: guard,
    apiKey: 'dummy_key',
    useCache: false,
  });

  await assert.rejects(
    async () => {
      await client.auditListingMultimodal({
        listingText: 'depto prueba',
        renterProfile: {
          max_total_monthly_budget_clp: 500000,
          requires_pet_friendly: true,
          requires_washer_connection: false,
          requires_direct_natural_light: false,
          max_minutes_to_metro: 20,
          preferred_communes: ['Ñuñoa'],
        },
      });
    },
    /BudgetGuard Firewall/
  );

  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
});
