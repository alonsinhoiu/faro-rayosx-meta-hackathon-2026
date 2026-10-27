import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTrueMonthlyCost } from '../dist/validators/financial.js';
import { evaluateDealBreakerVeto } from '../dist/validators/veto.js';
import { computeDualScorecard } from '../dist/validators/scorecard.js';

test('Financial Validator: calculates true monthly cost with amortized commission and GGCC', () => {
  const financial: FinancialExtraction = {
    listed_base_rent_clp: 500000,
    listed_ggcc_clp: 70000,
    contract_rent_clp_or_uf: '500.000 CLP',
    contract_ggcc_clause_quote: 'Gastos comunes $70.000',
    broker_commission_pct: 50, // 50% + 19% IVA = 59.5% of 500.000 = 297.500 / 12 = 24.792
    security_deposit_months: 1,
    readjustment_mechanism: 'IPC_ANUAL',
    minimum_income_multiplier: 3,
    requires_aval: 'SI',
  };

  const result = calculateTrueMonthlyCost(financial);

  assert.equal(result.base_rent_clp, 500000);
  assert.equal(result.ggcc_clp, 70000);
  assert.equal(result.ggcc_is_estimated, false);
  assert.equal(result.amortized_monthly_broker_fee_clp, 24792);
  assert.equal(result.true_monthly_cost_year_one_clp, 500000 + 70000 + 24792);
  assert.ok(result.difference_vs_listed_rent_clp > 94000);
});

test('Financial Validator: flags missing GGCC as estimated fallback', () => {
  const financial: FinancialExtraction = {
    listed_base_rent_clp: 600000,
    listed_ggcc_clp: null, // missing in ad!
    contract_rent_clp_or_uf: '600.000 CLP',
    contract_ggcc_clause_quote: null,
    broker_commission_pct: null,
    security_deposit_months: 1,
    readjustment_mechanism: 'FIJO_CLP',
    minimum_income_multiplier: null,
    requires_aval: 'NO_ESPECIFICADO',
  };

  const result = calculateTrueMonthlyCost(financial);

  assert.equal(result.ggcc_is_estimated, true);
  assert.equal(result.ggcc_clp, 90000); // 15% of 600.000
  assert.equal(result.true_monthly_cost_year_one_clp, 690000);
});

test('Veto Gate: hard blocks property when True Monthly Cost exceeds max budget', () => {
  const mockCost = {
    base_rent_clp: 600000,
    ggcc_clp: 80000,
    ggcc_is_estimated: false,
    amortized_monthly_broker_fee_clp: 29750,
    readjustment_buffer_monthly_clp: 0,
    true_monthly_cost_year_one_clp: 709750,
    difference_vs_listed_rent_clp: 109750,
    percentage_increase_vs_listed: 18.3,
  };

  const mockProfile: RenterProfile = {
    max_total_monthly_budget_clp: 650000,
    requires_pet_friendly: true,
    requires_washer_connection: true,
    requires_direct_natural_light: true,
    max_minutes_to_metro: 15,
    preferred_communes: ['Providencia'],
  };

  const mockAudit: ForensicRentalAuditResult = {
    financial_extraction: {
      listed_base_rent_clp: 600000,
      listed_ggcc_clp: 80000,
      contract_rent_clp_or_uf: '600.000 CLP',
      contract_ggcc_clause_quote: '80.000',
      broker_commission_pct: 50,
      security_deposit_months: 1,
      readjustment_mechanism: 'IPC_ANUAL',
      minimum_income_multiplier: 3,
      requires_aval: 'SI',
    },
    visual_findings: [],
    cross_modal_contradictions: [],
    rubric_15_checks: [],
    scam_and_manipulation_signals: [],
    tenant_action_pack: {
      whatsapp_broker_questions: '',
      contract_redline_proposals: [],
    },
  };

  const veto = evaluateDealBreakerVeto(mockAudit, mockCost, mockProfile);

  assert.equal(veto.is_vetoed, true);
  assert.equal(veto.verdict, 'VETOED_BY_BUDGET');
  assert.equal(veto.budget_overrun_clp, 59750);
});

test('Scorecard Engine: decouples fit score from evidence coverage', () => {
  const checks = [
    { check_code: 'RENT_PRICE', dimension: 'FINANCIAL' as const, title: 'Precio', status: 'pass' as const, provenance_tag: 'EXTRACTED_TEXT' as const, evidence_quote_or_coord: '$500k' },
    { check_code: 'GGCC_FEE', dimension: 'FINANCIAL' as const, title: 'GGCC', status: 'unknown' as const, provenance_tag: 'INFERRED' as const, evidence_quote_or_coord: 'omitido' },
    { check_code: 'LIGHT_NATURAL', dimension: 'PHYSICAL_VISUAL' as const, title: 'Luz', status: 'pass' as const, provenance_tag: 'EXTRACTED_PHOTO' as const, evidence_quote_or_coord: 'foto 1' },
    { check_code: 'MOLD_MOISTURE', dimension: 'PHYSICAL_VISUAL' as const, title: 'Humedad', status: 'fail' as const, provenance_tag: 'EXTRACTED_PHOTO' as const, evidence_quote_or_coord: 'foto 3' },
  ];

  const scorecard = computeDualScorecard(checks);

  assert.equal(scorecard.checks_summary.passed, 2);
  assert.equal(scorecard.checks_summary.failed, 1);
  assert.equal(scorecard.checks_summary.unknown, 1);
  assert.equal(scorecard.evidence_coverage_pct, 75); // 3 verified / 4 applicable
  assert.equal(scorecard.transparency_tier, 'ALTA_TRANSPARENCIA');
});
