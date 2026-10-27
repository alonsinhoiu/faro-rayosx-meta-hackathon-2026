import { RubricCheckItem } from '../types/audit.js';

export interface DualScorecardResult {
  verified_fit_score_100: number; // 0 to 100
  evidence_coverage_pct: number; // 0 to 100%
  transparency_tier: 'ALTA_TRANSPARENCIA' | 'OPACIDAD_MODERADA' | 'ALTO_RIESGO_OPACIDAD';
  checks_summary: {
    passed: number;
    failed: number;
    unknown: number;
    not_applicable: number;
    total: number;
  };
  dimension_scores: Record<string, { pass: number; fail: number; unknown: number; weight_pct: number }>;
}

const DIMENSION_WEIGHTS: Record<string, number> = {
  FINANCIAL: 0.35,
  PHYSICAL_VISUAL: 0.25,
  CONTRACTUAL_LEGAL: 0.25,
  LIFESTYLE_FIT: 0.15,
};

/**
 * 2-Axis Scorecard Engine (Inspired by AgriciDaniel/claude-ads)
 * Decouples verified health/fit from evidence completeness.
 */
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

  // Evidence Coverage %
  const coveragePct = applicableChecks > 0 ? (verifiedChecks / applicableChecks) * 100 : 0;

  // Weighted Fit Score based on verified items
  let weightedScore = 0;
  for (const [dimKey, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const stat = dimStats[dimKey];
    const totalInDim = stat.pass + stat.fail;
    if (totalInDim > 0) {
      const dimPassRate = stat.pass / totalInDim;
      weightedScore += dimPassRate * weight * 100;
    } else {
      // Neutral baseline if entire dimension is unknown
      weightedScore += 0.5 * weight * 100;
    }
  }

  let transparencyTier: 'ALTA_TRANSPARENCIA' | 'OPACIDAD_MODERADA' | 'ALTO_RIESGO_OPACIDAD' = 'ALTA_TRANSPARENCIA';
  if (coveragePct < 50) {
    transparencyTier = 'ALTO_RIESGO_OPACIDAD';
  } else if (coveragePct < 75) {
    transparencyTier = 'OPACIDAD_MODERADA';
  }

  return {
    verified_fit_score_100: Math.round(weightedScore),
    evidence_coverage_pct: Math.round(coveragePct),
    transparency_tier: transparencyTier,
    checks_summary: {
      passed,
      failed,
      unknown,
      not_applicable: notApplicable,
      total: checks.length,
    },
    dimension_scores: dimStats,
  };
}
