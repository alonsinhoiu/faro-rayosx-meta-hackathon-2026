/**
 * JSON Schema Contract for Meta Model API (muse-spark-1.3)
 * Endpoint: POST https://api.meta.ai/v1/responses
 * Used inside: text.format.schema
 */

export const FARO_AUDIT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    financial_extraction: {
      type: 'object',
      properties: {
        listed_base_rent_clp: { type: 'number' },
        listed_ggcc_clp: { type: ['number', 'null'] },
        contract_rent_clp_or_uf: { type: 'string' },
        contract_ggcc_clause_quote: { type: ['string', 'null'] },
        broker_commission_pct: { type: ['number', 'null'] },
        security_deposit_months: { type: ['number', 'null'] },
        readjustment_mechanism: {
          type: 'string',
          enum: [
            'IPC_SEMESTRAL',
            'IPC_ANUAL',
            'UF_MENSUAL',
            'UF_MAS_SPREAD',
            'FIJO_CLP',
            'NO_ESPECIFICADO',
          ],
        },
        minimum_income_multiplier: { type: ['number', 'null'] },
        requires_aval: { type: 'string', enum: ['SI', 'NO', 'NO_ESPECIFICADO'] },
      },
      required: [
        'listed_base_rent_clp',
        'listed_ggcc_clp',
        'contract_rent_clp_or_uf',
        'contract_ggcc_clause_quote',
        'broker_commission_pct',
        'security_deposit_months',
        'readjustment_mechanism',
        'minimum_income_multiplier',
        'requires_aval',
      ],
      additionalProperties: false,
    },
    visual_findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          finding_id: { type: 'string' },
          photo_index: { type: 'integer' },
          object_or_defect_label: { type: 'string' },
          sam_target_noun_phrase: { type: 'string' },
          category: {
            type: 'string',
            enum: ['DEFECT_RISK', 'LIGHTING_VENTILATION', 'AMENITY_VERIFIED', 'SPACE_CONSTRAINT'],
          },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'POSITIVE'] },
          bbox_1000: {
            type: 'object',
            properties: {
              x_min: { type: 'integer' },
              y_min: { type: 'integer' },
              x_max: { type: 'integer' },
              y_max: { type: 'integer' },
            },
            required: ['x_min', 'y_min', 'x_max', 'y_max'],
            additionalProperties: false,
          },
          visual_explanation: { type: 'string' },
        },
        required: [
          'finding_id',
          'photo_index',
          'object_or_defect_label',
          'sam_target_noun_phrase',
          'category',
          'severity',
          'bbox_1000',
          'visual_explanation',
        ],
        additionalProperties: false,
      },
    },
    cross_modal_contradictions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contradiction_id: { type: 'string' },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM'] },
          listing_claim_quote: { type: 'string' },
          contradicting_source: {
            type: 'string',
            enum: ['PHOTO_EVIDENCE', 'PDF_CONTRACT_CLAUSE', 'POST_VISIT_VOICE_NOTE'],
          },
          contradicting_evidence_detail: { type: 'string' },
          impact_on_tenant: { type: 'string' },
        },
        required: [
          'contradiction_id',
          'severity',
          'listing_claim_quote',
          'contradicting_source',
          'contradicting_evidence_detail',
          'impact_on_tenant',
        ],
        additionalProperties: false,
      },
    },
    rubric_15_checks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          check_code: { type: 'string' },
          dimension: {
            type: 'string',
            enum: ['FINANCIAL', 'PHYSICAL_VISUAL', 'CONTRACTUAL_LEGAL', 'LIFESTYLE_FIT'],
          },
          title: { type: 'string' },
          status: { type: 'string', enum: ['pass', 'fail', 'unknown', 'not_applicable'] },
          provenance_tag: {
            type: 'string',
            enum: ['EXTRACTED_TEXT', 'EXTRACTED_PHOTO', 'EXTRACTED_PDF', 'EXTRACTED_VOICE', 'INFERRED'],
          },
          evidence_quote_or_coord: { type: 'string' },
        },
        required: [
          'check_code',
          'dimension',
          'title',
          'status',
          'provenance_tag',
          'evidence_quote_or_coord',
        ],
        additionalProperties: false,
      },
    },
    scam_and_manipulation_signals: {
      type: 'array',
      items: { type: 'string' },
    },
    tenant_action_pack: {
      type: 'object',
      properties: {
        whatsapp_broker_questions: { type: 'string' },
        contract_redline_proposals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original_clause_ref: { type: 'string' },
              risk_explanation: { type: 'string' },
              proposed_replacement_text: { type: 'string' },
            },
            required: ['original_clause_ref', 'risk_explanation', 'proposed_replacement_text'],
            additionalProperties: false,
          },
        },
      },
      required: ['whatsapp_broker_questions', 'contract_redline_proposals'],
      additionalProperties: false,
    },
  },
  required: [
    'financial_extraction',
    'visual_findings',
    'cross_modal_contradictions',
    'rubric_15_checks',
    'scam_and_manipulation_signals',
    'tenant_action_pack',
  ],
  additionalProperties: false,
} as const;
