import type {
  DualScorecardResult,
  FinancialExtraction,
  ForensicRentalAuditResult,
  RenterProfile,
  RubricCheckItem,
  TrueMonthlyCostResult,
  VetoEvaluationResult,
} from './types';

/**
 * Réplica determinista 1:1 de src/validators/financial.ts.
 * El LLM nunca calcula: esta es la única fuente de verdad financiera.
 */
export function calculateTrueMonthlyCost(
  financial: FinancialExtraction,
  options: { defaultMissingGgccRate?: number; annualInflationEstimatePct?: number } = {},
): TrueMonthlyCostResult {
  const baseRent = Math.max(0, financial.listed_base_rent_clp);
  const defaultRate = options.defaultMissingGgccRate ?? 0.15;
  const inflationPct = options.annualInflationEstimatePct ?? 3.8;

  let ggcc = 0;
  let ggccIsEstimated = false;
  if (financial.listed_ggcc_clp !== null && financial.listed_ggcc_clp > 0) {
    ggcc = financial.listed_ggcc_clp;
  } else {
    ggcc = Math.round(baseRent * defaultRate);
    ggccIsEstimated = true;
  }

  let amortizedBrokerFee = 0;
  if (financial.broker_commission_pct !== null && financial.broker_commission_pct > 0) {
    const totalBrokerFee = baseRent * (financial.broker_commission_pct / 100) * 1.19;
    amortizedBrokerFee = Math.round(totalBrokerFee / 12);
  }

  let readjustmentBuffer = 0;
  switch (financial.readjustment_mechanism) {
    case 'UF_MENSUAL':
    case 'UF_MAS_SPREAD':
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

/** Réplica determinista 1:1 de src/validators/veto.ts */
export function evaluateDealBreakerVeto(
  audit: ForensicRentalAuditResult,
  cost: TrueMonthlyCostResult,
  profile: RenterProfile,
): VetoEvaluationResult {
  const reasons: string[] = [];

  const budgetOverrun = cost.true_monthly_cost_year_one_clp - profile.max_total_monthly_budget_clp;
  if (budgetOverrun > 0) {
    reasons.push(
      `El Costo Mensual Real ($${cost.true_monthly_cost_year_one_clp.toLocaleString('es-CL')} CLP) supera tu presupuesto máximo ($${profile.max_total_monthly_budget_clp.toLocaleString('es-CL')} CLP) por $${budgetOverrun.toLocaleString('es-CL')} CLP.`,
    );
  }

  if (profile.requires_pet_friendly) {
    const petCheck = audit.rubric_15_checks.find((c) => c.check_code === 'PET_POLICY');
    if (petCheck && petCheck.status === 'fail') {
      reasons.push('VETO: La propiedad prohíbe expresamente mascotas en el contrato o reglamento.');
    }
    const petContradiction = audit.cross_modal_contradictions.find(
      (c) =>
        c.listing_claim_quote.toLowerCase().includes('mascota') ||
        c.contradicting_evidence_detail.toLowerCase().includes('mascota'),
    );
    if (petContradiction && petContradiction.severity === 'CRITICAL') {
      reasons.push(`VETO: Contradicción crítica en mascotas: ${petContradiction.contradicting_evidence_detail}`);
    }
  }

  if (profile.requires_washer_connection) {
    const washerCheck = audit.rubric_15_checks.find((c) => c.check_code === 'WASHER_CONNECTION');
    if (washerCheck && washerCheck.status === 'fail') {
      reasons.push('VETO: La propiedad no cuenta con conexión para lavadora en fotos ni contrato.');
    }
  }

  const criticalDefects = audit.visual_findings.filter(
    (f) => f.severity === 'CRITICAL' && f.category === 'DEFECT_RISK',
  );
  if (criticalDefects.length > 0) {
    criticalDefects.forEach((d) => {
      reasons.push(
        `ALERTA CRÍTICA ESTRUCTURAL: ${d.object_or_defect_label} en Foto ${d.photo_index + 1} (${d.visual_explanation})`,
      );
    });
  }

  const isVetoed = reasons.length > 0;
  let verdict: VetoEvaluationResult['verdict'] = 'APPROVED_FOR_REVIEW';
  if (budgetOverrun > 0) {
    verdict = 'VETOED_BY_BUDGET';
  } else if (isVetoed) {
    verdict = 'VETOED_BY_CONSTRAINT';
  }

  return { verdict, is_vetoed: isVetoed, reasons, budget_overrun_clp: Math.max(0, budgetOverrun) };
}

/** Réplica determinista 1:1 de src/validators/scorecard.ts */
const DIMENSION_WEIGHTS: Record<string, number> = {
  FINANCIAL: 0.35,
  PHYSICAL_VISUAL: 0.25,
  CONTRACTUAL_LEGAL: 0.25,
  LIFESTYLE_FIT: 0.15,
};

export function computeDualScorecard(checks: RubricCheckItem[]): DualScorecardResult {
  let passed = 0;
  let failed = 0;
  let unknown = 0;
  let notApplicable = 0;

  const dimStats: Record<string, { pass: number; fail: number; unknown: number; weight_pct: number }> = {
    FINANCIAL: { pass: 0, fail: 0, unknown: 0, weight_pct: 35 },
    PHYSICAL_VISUAL: { pass: 0, fail: 0, unknown: 0, weight_pct: 25 },
    CONTRACTUAL_LEGAL: { pass: 0, fail: 0, unknown: 0, weight_pct: 25 },
    LIFESTYLE_FIT: { pass: 0, fail: 0, unknown: 0, weight_pct: 15 },
  };

  for (const check of checks) {
    const dim = dimStats[check.dimension] || dimStats.FINANCIAL;
    switch (check.status) {
      case 'pass':
        passed++;
        dim.pass++;
        break;
      case 'fail':
        failed++;
        dim.fail++;
        break;
      case 'unknown':
        unknown++;
        dim.unknown++;
        break;
      case 'not_applicable':
        notApplicable++;
        break;
    }
  }

  const applicableChecks = passed + failed + unknown;
  const verifiedChecks = passed + failed;
  const coveragePct = applicableChecks > 0 ? (verifiedChecks / applicableChecks) * 100 : 0;

  let weightedScore = 0;
  for (const [dimKey, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const stat = dimStats[dimKey];
    const totalInDim = stat.pass + stat.fail;
    if (totalInDim > 0) {
      weightedScore += (stat.pass / totalInDim) * weight * 100;
    } else {
      weightedScore += 0.5 * weight * 100;
    }
  }

  let transparencyTier: DualScorecardResult['transparency_tier'] = 'ALTA_TRANSPARENCIA';
  if (coveragePct < 50) transparencyTier = 'ALTO_RIESGO_OPACIDAD';
  else if (coveragePct < 75) transparencyTier = 'OPACIDAD_MODERADA';

  return {
    verified_fit_score_100: Math.round(weightedScore),
    evidence_coverage_pct: Math.round(coveragePct),
    transparency_tier: transparencyTier,
    checks_summary: { passed, failed, unknown, not_applicable: notApplicable, total: checks.length },
    dimension_scores: dimStats,
  };
}
