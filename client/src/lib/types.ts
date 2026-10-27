/**
 * Tipos espejo de src/types/audit.ts + respuestas de la API local.
 * No se importa del backend: el bundle web es autocontenido.
 */

export type RubricCheckStatus = 'pass' | 'fail' | 'unknown' | 'not_applicable';

export type ProvenanceTag =
  | 'EXTRACTED_TEXT'
  | 'EXTRACTED_PHOTO'
  | 'EXTRACTED_PDF'
  | 'EXTRACTED_VOICE'
  | 'INFERRED';

export type ReadjustmentMechanism =
  | 'IPC_SEMESTRAL'
  | 'IPC_ANUAL'
  | 'UF_MENSUAL'
  | 'UF_MAS_SPREAD'
  | 'FIJO_CLP'
  | 'NO_ESPECIFICADO';

export interface BoundingBox1000 {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface VisualFinding {
  finding_id: string;
  photo_index: number;
  object_or_defect_label: string;
  sam_target_noun_phrase: string;
  category: 'DEFECT_RISK' | 'LIGHTING_VENTILATION' | 'AMENITY_VERIFIED' | 'SPACE_CONSTRAINT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'POSITIVE';
  bbox_1000: BoundingBox1000;
  visual_explanation: string;
}

export interface CrossModalContradiction {
  contradiction_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  listing_claim_quote: string;
  contradicting_source: 'PHOTO_EVIDENCE' | 'PDF_CONTRACT_CLAUSE' | 'POST_VISIT_VOICE_NOTE';
  contradicting_evidence_detail: string;
  impact_on_tenant: string;
}

export interface RubricCheckItem {
  check_code: string;
  dimension: 'FINANCIAL' | 'PHYSICAL_VISUAL' | 'CONTRACTUAL_LEGAL' | 'LIFESTYLE_FIT';
  title: string;
  status: RubricCheckStatus;
  provenance_tag: ProvenanceTag;
  evidence_quote_or_coord: string;
}

export interface FinancialExtraction {
  listed_base_rent_clp: number;
  listed_ggcc_clp: number | null;
  contract_rent_clp_or_uf: string;
  contract_ggcc_clause_quote: string | null;
  broker_commission_pct: number | null;
  security_deposit_months: number | null;
  readjustment_mechanism: ReadjustmentMechanism;
  minimum_income_multiplier: number | null;
  requires_aval: 'SI' | 'NO' | 'NO_ESPECIFICADO';
}

export interface ContractRedlineProposal {
  original_clause_ref: string;
  risk_explanation: string;
  proposed_replacement_text: string;
}

export interface TenantActionPack {
  whatsapp_broker_questions: string;
  contract_redline_proposals: ContractRedlineProposal[];
}

export interface ForensicRentalAuditResult {
  financial_extraction: FinancialExtraction;
  visual_findings: VisualFinding[];
  cross_modal_contradictions: CrossModalContradiction[];
  rubric_15_checks: RubricCheckItem[];
  scam_and_manipulation_signals: string[];
  tenant_action_pack: TenantActionPack;
}

export interface RenterProfile {
  max_total_monthly_budget_clp: number;
  requires_pet_friendly: boolean;
  requires_washer_connection: boolean;
  requires_direct_natural_light: boolean;
  max_minutes_to_metro: number;
  preferred_communes: string[];
}

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

export type VetoVerdict = 'APPROVED_FOR_REVIEW' | 'VETOED_BY_BUDGET' | 'VETOED_BY_CONSTRAINT';

export interface VetoEvaluationResult {
  verdict: VetoVerdict;
  is_vetoed: boolean;
  reasons: string[];
  budget_overrun_clp: number;
}

export interface DualScorecardResult {
  verified_fit_score_100: number;
  evidence_coverage_pct: number;
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

export interface ListingAd {
  title: string;
  commune: string;
  address_hint: string;
  body_text: string;
}

export interface SampleFixture {
  renter_profile: RenterProfile;
  listing_ad: ListingAd;
  audit_result: ForensicRentalAuditResult;
}

export interface AuditApiResponse {
  property_id: string;
  from_cache: boolean;
  reasoning_summary: string;
  financial_breakdown: TrueMonthlyCostResult;
  veto_evaluation: VetoEvaluationResult;
  dual_scorecard: DualScorecardResult;
  audit: ForensicRentalAuditResult;
}

/** Estado unificado que consume el workbench, venga de fixture o de POST /api/audit. */
export interface WorkbenchCase {
  renterProfile: RenterProfile;
  listingAd: ListingAd | { title: string; commune: string; address_hint: string; body_text: string };
  audit: ForensicRentalAuditResult;
  cost: TrueMonthlyCostResult;
  veto: VetoEvaluationResult;
  scorecard: DualScorecardResult;
  reasoningSummary?: string;
  fromCache?: boolean;
  propertyId?: string;
}
