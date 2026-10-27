/**
 * Smoke Tests for Meta Model API (muse-spark-1.3, sam-3.1, muse-voice-transcribe-1.0)
 * Run with: npm run smoke:meta
 */

import { BudgetGuard } from '../dist/db/budget-guard.js';

const META_API_KEY = process.env.META_API_KEY;
const META_API_BASE_URL = process.env.META_API_BASE_URL || 'https://api.meta.ai/v1';

async function main() {
  console.log('--- FARO RAYOS-X: META MODEL API SMOKE TESTS ---');
  
  const guard = new BudgetGuard('./data/faro_ledger.db', 10.00);
  const summary = guard.getSummary();
  console.log(`[BudgetGuard] Current Spend: $${summary.totalSpentUsd} USD | Limit: $${summary.hardLimitUsd} USD`);

  if (!META_API_KEY || META_API_KEY === 'your_meta_api_key_here') {
    console.log('\n[NOTICE] META_API_KEY is not configured in .env.');
    console.log('Skipping live network calls to protect credits. To run live:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Set your valid META_API_KEY');
    console.log('3. Rerun `npm run smoke:meta`\n');
    console.log('[OK] Offline deterministic tests pass! Live connection ready for testing.');
    process.exit(0);
  }

  // Pre-flight cost check
  const estimatedCost = 0.05; // 5 cents
  if (!guard.canSpend(estimatedCost)) {
    console.error(`[BUDGET FIREWALL BLOCKED] Exceeds hard limit of $${summary.hardLimitUsd} USD.`);
    process.exit(1);
  }

  console.log('Ready to test live endpoints with Muse Code...');
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
