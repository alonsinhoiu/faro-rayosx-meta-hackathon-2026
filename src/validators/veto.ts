import { ForensicRentalAuditResult, RenterProfile } from '../types/audit.js';
import { TrueMonthlyCostResult } from './financial.js';

export type VetoVerdict = 'APPROVED_FOR_REVIEW' | 'VETOED_BY_BUDGET' | 'VETOED_BY_CONSTRAINT';

export interface VetoEvaluationResult {
  verdict: VetoVerdict;
  is_vetoed: boolean;
  reasons: string[];
  budget_overrun_clp: number;
}

/**
 * Hard Deal-Breaker Veto Gate
 * Soft LLM prose CANNOT override these boolean rules.
 */
export function evaluateDealBreakerVeto(
  audit: ForensicRentalAuditResult,
  cost: TrueMonthlyCostResult,
  profile: RenterProfile
): VetoEvaluationResult {
  const reasons: string[] = [];

  // 1. Budget Hard Cap
  const budgetOverrun = cost.true_monthly_cost_year_one_clp - profile.max_total_monthly_budget_clp;
  if (budgetOverrun > 0) {
    reasons.push(
      `El Costo Mensual Real ($${cost.true_monthly_cost_year_one_clp.toLocaleString('es-CL')} CLP) supera tu presupuesto máximo ($${profile.max_total_monthly_budget_clp.toLocaleString('es-CL')} CLP) por $${budgetOverrun.toLocaleString('es-CL')} CLP.`
    );
  }

  // 2. Pet Friendly Constraint
  if (profile.requires_pet_friendly) {
    const petCheck = audit.rubric_15_checks.find((c) => c.check_code === 'PET_POLICY');
    if (petCheck && petCheck.status === 'fail') {
      reasons.push('VETO: La propiedad prohíbe expresamente mascotas en el contrato o reglamento.');
    }
    // Also check contradictions
    const petContradiction = audit.cross_modal_contradictions.find(
      (c) => c.listing_claim_quote.toLowerCase().includes('mascota') || c.contradicting_evidence_detail.toLowerCase().includes('mascota')
    );
    if (petContradiction && petContradiction.severity === 'CRITICAL') {
      reasons.push(`VETO: Contradicción crítica en mascotas: ${petContradiction.contradicting_evidence_detail}`);
    }
  }

  // 3. Washer Connection Constraint
  if (profile.requires_washer_connection) {
    const washerCheck = audit.rubric_15_checks.find((c) => c.check_code === 'WASHER_CONNECTION');
    if (washerCheck && washerCheck.status === 'fail') {
      reasons.push('VETO: La propiedad no cuenta con conexión para lavadora en fotos ni contrato.');
    }
  }

  // 4. Critical Structural Contradictions
  const criticalDefects = audit.visual_findings.filter(
    (f) => f.severity === 'CRITICAL' && f.category === 'DEFECT_RISK'
  );
  if (criticalDefects.length > 0) {
    criticalDefects.forEach((d) => {
      reasons.push(`ALERTA CRÍTICA ESTRUCTURAL: ${d.object_or_defect_label} en Foto ${d.photo_index + 1} (${d.visual_explanation})`);
    });
  }

  const isVetoed = reasons.length > 0;
  let verdict: VetoVerdict = 'APPROVED_FOR_REVIEW';
  if (budgetOverrun > 0) {
    verdict = 'VETOED_BY_BUDGET';
  } else if (isVetoed) {
    verdict = 'VETOED_BY_CONSTRAINT';
  }

  return {
    verdict,
    is_vetoed: isVetoed,
    reasons,
    budget_overrun_clp: Math.max(0, budgetOverrun),
  };
}
