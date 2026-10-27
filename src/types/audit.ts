/**
 * Core Types for FARO Rayos-X Forensic Rental Auditor
 * Schema contract with Meta Model API (muse-spark-1.3) via POST /v1/responses
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
  x_min: number; // 0 to 1000
  y_min: number; // 0 to 1000
  x_max: number; // 0 to 1000
  y_max: number; // 0 to 1000
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
  broker_commission_pct: number | null; // e.g. 50 (%)
  security_deposit_months: number | null; // e.g. 1 or 2
  readjustment_mechanism: ReadjustmentMechanism;
  minimum_income_multiplier: number | null; // e.g. 3 (times rent)
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
