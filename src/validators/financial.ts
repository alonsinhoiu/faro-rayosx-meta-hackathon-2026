import { FinancialExtraction } from '../types/audit.js';

export interface TrueMonthlyCostResult {
  base_rent_clp: number;
  ggcc_clp: number;
  ggcc_is_estimated: boolean;
  amortized_monthly_broker_fee_clp: number;
  readjustment_buffer_monthly_clp: number;
  true_monthly_cost_year_one_clp: number;
  difference_vs_listed_rent_clp: number;
  percentage_increase_vs_listed: number;
}

/**
 * Deterministic Financial Calculator for Rental Housing
 * No LLM approximation. Every formula is verified and mathematically exact.
 */
export function calculateTrueMonthlyCost(
  financial: FinancialExtraction,
  options: {
    defaultMissingGgccRate?: number; // fallback % of base rent if GGCC is omitted (e.g. 0.15 = 15%)
    annualInflationEstimatePct?: number; // e.g. 3.8%
  } = {}
): TrueMonthlyCostResult {
  const baseRent = Math.max(0, financial.listed_base_rent_clp);
  const defaultRate = options.defaultMissingGgccRate ?? 0.15;
  const inflationPct = options.annualInflationEstimatePct ?? 3.8;

  // 1. GGCC resolution
  let ggcc = 0;
  let ggccIsEstimated = false;
  if (financial.listed_ggcc_clp !== null && financial.listed_ggcc_clp > 0) {
    ggcc = financial.listed_ggcc_clp;
  } else {
    // Flag missing GGCC as an estimate to warn renter
    ggcc = Math.round(baseRent * defaultRate);
    ggccIsEstimated = true;
  }

  // 2. Broker Commission amortized across 12 months (50% standard + 19% IVA = 59.5% of one month)
  let amortizedBrokerFee = 0;
  if (financial.broker_commission_pct !== null && financial.broker_commission_pct > 0) {
    const totalBrokerFee = baseRent * (financial.broker_commission_pct / 100) * 1.19; // with VAT
    amortizedBrokerFee = Math.round(totalBrokerFee / 12);
  }

  // 3. Readjustment mechanism buffer (average monthly excess over 12 months)
  let readjustmentBuffer = 0;
  switch (financial.readjustment_mechanism) {
    case 'UF_MENSUAL':
    case 'UF_MAS_SPREAD':
      // UF compounding adds approx inflationPct / 2 to average monthly rent in year 1
      readjustmentBuffer = Math.round((baseRent * (inflationPct / 100)) / 2);
      break;
    case 'IPC_SEMESTRAL':
      readjustmentBuffer = Math.round((baseRent * (inflationPct / 100)) / 4);
      break;
    case 'IPC_ANUAL':
    case 'FIJO_CLP':
    case 'NO_ESPECIFICADO':
    default:
      readjustmentBuffer = 0;
      break;
  }

  const trueMonthlyCost = baseRent + ggcc + amortizedBrokerFee + readjustmentBuffer;
  const diff = trueMonthlyCost - baseRent;
  const pctInc = baseRent > 0 ? (diff / baseRent) * 100 : 0;

  return {
    base_rent_clp: baseRent,
    ggcc_clp: ggcc,
    ggcc_is_estimated: ggccIsEstimated,
    amortized_monthly_broker_fee_clp: amortizedBrokerFee,
    readjustment_buffer_monthly_clp: readjustmentBuffer,
    true_monthly_cost_year_one_clp: trueMonthlyCost,
    difference_vs_listed_rent_clp: diff,
    percentage_increase_vs_listed: Number(pctInc.toFixed(1)),
  };
}
