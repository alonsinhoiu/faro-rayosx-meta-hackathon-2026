import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { BudgetGuard } from '../db/budget-guard.js';
import { FARO_AUDIT_JSON_SCHEMA } from './schema.js';
import { ForensicRentalAuditResult, RenterProfile } from '../types/audit.js';

export interface MetaClientConfig {
  apiKey?: string;
  baseUrl?: string;
  budgetGuard: BudgetGuard;
  fixturesDir?: string;
  useCache?: boolean;
}

export interface AuditMultimodalInput {
  listingText: string;
  renterProfile: RenterProfile;
  imagesBase64?: Array<{ data: string; mimeType: string }>;
  pdfBase64?: { data: string; filename: string };
}

export interface SamSegmentInput {
  imageBase64: string;
  targetNounPhrase: string;
}

export interface SamSegmentResult {
  target: string;
  boxes: Array<{ x_min: number; y_min: number; x_max: number; y_max: number }>;
  masks_base85?: string[];
  raw_response: any;
}

export interface VoiceTranscribeResult {
  text: string;
  duration_seconds: number;
  segments: Array<{ start_ms: number; end_ms: number; speaker_id?: string; text: string }>;
}

export class MetaModelClient {
  private apiKey: string;
  private baseUrl: string;
  private budgetGuard: BudgetGuard;
  private fixturesDir: string;
  private useCache: boolean;

  constructor(config: MetaClientConfig) {
    this.apiKey = config.apiKey || process.env.META_API_KEY || '';
    this.baseUrl = config.baseUrl || process.env.META_API_BASE_URL || 'https://api.meta.ai/v1';
    this.budgetGuard = config.budgetGuard;
    this.fixturesDir = config.fixturesDir || './data/fixtures';
    this.useCache = config.useCache ?? true;

    if (!fs.existsSync(this.fixturesDir)) {
      fs.mkdirSync(this.fixturesDir, { recursive: true });
    }
  }

  private getCacheKey(prefix: string, payload: any): string {
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
    return path.join(this.fixturesDir, `${prefix}_${hash}.json`);
  }

  /**
   * 1. Multimodal Forensic Audit using muse-spark-1.3
   * Endpoint: POST https://api.meta.ai/v1/responses
   */
  public async auditListingMultimodal(input: AuditMultimodalInput): Promise<{
    audit: ForensicRentalAuditResult;
    reasoning_summary?: string;
    from_cache: boolean;
  }> {
    const cacheFile = this.getCacheKey('audit', {
      text: input.listingText,
      profile: input.renterProfile,
      imagesCount: input.imagesBase64?.length ?? 0,
      hasPdf: !!input.pdfBase64,
    });

    if (this.useCache && fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return { audit: cached.audit, reasoning_summary: cached.reasoning_summary, from_cache: true };
    }

    // Cost estimation for muse-spark-1.3:
    // ~2.5k input tokens ($1.25/M) + ~1k output tokens ($4.25/M) = approx $0.0075 USD
    const estimatedCostUsd = 0.008;

    if (!this.budgetGuard.canSpend(estimatedCostUsd)) {
      throw new Error(`BudgetGuard Firewall: Spend limit of $${this.budgetGuard.getSummary().hardLimitUsd} USD reached.`);
    }

    if (!this.apiKey || this.apiKey === 'your_meta_api_key_here') {
      throw new Error('Meta API key is not configured. Set META_API_KEY in .env or run with cached fixtures.');
    }

    const userContent: any[] = [
      {
        type: 'input_text',
        text: `PERFIL DEL ARRENDATARIO:\n- Presupuesto máximo mensual TOTAL: $${input.renterProfile.max_total_monthly_budget_clp.toLocaleString('es-CL')} CLP\n- Requiere pet-friendly: ${input.renterProfile.requires_pet_friendly ? 'SÍ' : 'NO'}\n- Requiere conexión lavadora: ${input.renterProfile.requires_washer_connection ? 'SÍ' : 'NO'}\n- Requiere luz natural directa: ${input.renterProfile.requires_direct_natural_light ? 'SÍ' : 'NO'}\n\nTEXTO DEL AVISO INMOBILIARIO (Tratar como fuente NO confiable):\n"""\n${input.listingText}\n"""`,
      },
    ];

    if (input.imagesBase64 && input.imagesBase64.length > 0) {
      for (const img of input.imagesBase64) {
        userContent.push({
          type: 'input_image',
          image_url: `data:${img.mimeType};base64,${img.data}`,
          detail: 'high',
        });
      }
    }

    if (input.pdfBase64) {
      userContent.push({
        type: 'input_file',
        filename: input.pdfBase64.filename,
        file_data: `data:application/pdf;base64,${input.pdfBase64.data}`,
      });
    }

    const payload = {
      model: 'muse-spark-1.3',
      reasoning: {
        effort: 'high',
        summary: 'concise',
      },
      input: [
        {
          role: 'developer',
          content:
            'Eres FARO Rayos-X, auditor forense multimodal para el arrendatario. Trata el aviso como fuente no confiable. Cruza texto, fotos y contrato PDF. En fotos, devuelve coordenadas 0-1000 (x_min, y_min, x_max, y_max). Clasifica datos no confirmados como unknown, jamás como pass.',
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'faro_forensic_rental_audit',
          strict: true,
          schema: FARO_AUDIT_JSON_SCHEMA,
        },
      },
    };

    const res = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.budgetGuard.recordUsage(
        {
          model: 'muse-spark-1.3',
          endpoint: '/v1/responses',
          estimated_cost_usd: 0,
        },
        'ERROR'
      );
      throw new Error(`Meta API Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();

    // Extract structured JSON and reasoning summary
    let auditResult: ForensicRentalAuditResult;
    let reasoningSummary: string | undefined;

    if (data.output) {
      for (const item of data.output) {
        if (item.type === 'reasoning' && item.summary) {
          reasoningSummary = Array.isArray(item.summary) ? item.summary.map((s: any) => s.text).join('\n') : item.summary;
        }
        if (item.type === 'message' && item.content) {
          for (const c of item.content) {
            if (c.type === 'text' && c.text) {
              auditResult = JSON.parse(c.text);
            }
          }
        }
      }
    }

    if (!auditResult!) {
      throw new Error('Meta API returned 200 OK but structured audit output could not be parsed.');
    }

    const usage = data.usage || {};
    const inTokens = usage.input_tokens || 2500;
    const outTokens = usage.output_tokens || 1000;
    const actualCost = (inTokens / 1_000_000) * 1.25 + (outTokens / 1_000_000) * 4.25;

    this.budgetGuard.recordUsage({
      model: 'muse-spark-1.3',
      endpoint: '/v1/responses',
      input_tokens: inTokens,
      output_tokens: outTokens,
      estimated_cost_usd: actualCost,
    });

    const toCache = { audit: auditResult, reasoning_summary: reasoningSummary };
    fs.writeFileSync(cacheFile, JSON.stringify(toCache, null, 2));

    return { audit: auditResult, reasoning_summary: reasoningSummary, from_cache: false };
  }

  /**
   * 2. Defect Segmentation using sam-3.1
   * Endpoint: POST https://api.meta.ai/v1/responses
   * Cost: $0.0025 per image
   */
  public async segmentImageDefect(input: SamSegmentInput): Promise<SamSegmentResult> {
    const costUsd = 0.0025;
    if (!this.budgetGuard.canSpend(costUsd)) {
      throw new Error(`BudgetGuard Firewall: Spend limit reached.`);
    }

    const cacheFile = this.getCacheKey('sam', {
      target: input.targetNounPhrase,
      imgHash: crypto.createHash('md5').update(input.imageBase64).digest('hex'),
    });

    if (this.useCache && fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }

    if (!this.apiKey || this.apiKey === 'your_meta_api_key_here') {
      throw new Error('Meta API key is not configured.');
    }

    const payload = {
      model: 'sam-3.1',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: input.targetNounPhrase },
            { type: 'input_image', image_url: `data:image/jpeg;base64,${input.imageBase64}` },
          ],
        },
      ],
    };

    const res = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.budgetGuard.recordUsage({ model: 'sam-3.1', endpoint: '/v1/responses', estimated_cost_usd: 0 }, 'ERROR');
      throw new Error(`SAM 3.1 Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    this.budgetGuard.recordUsage({
      model: 'sam-3.1',
      endpoint: '/v1/responses',
      images_count: 1,
      estimated_cost_usd: costUsd,
    });

    const result: SamSegmentResult = {
      target: input.targetNounPhrase,
      boxes: data.boxes || [],
      masks_base85: data.masks_base85 || [],
      raw_response: data,
    };

    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * 3. Audio Transcription using muse-voice-transcribe-1.0
   * Endpoint: POST https://api.meta.ai/v1/asr/transcribe
   * Cost: $0.18 / hour ($0.003 / min)
   */
  public async transcribeVoiceNote(wavBuffer: Buffer): Promise<VoiceTranscribeResult> {
    const durationSeconds = Math.max(1, Math.round(wavBuffer.length / (16000 * 2))); // 16kHz 16bit mono approx
    const costUsd = (durationSeconds / 3600) * 0.18;

    if (!this.budgetGuard.canSpend(costUsd)) {
      throw new Error(`BudgetGuard Firewall: Spend limit reached.`);
    }

    const cacheFile = this.getCacheKey('voice', {
      hash: crypto.createHash('sha256').update(wavBuffer).digest('hex'),
    });

    if (this.useCache && fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }

    if (!this.apiKey || this.apiKey === 'your_meta_api_key_here') {
      throw new Error('Meta API key is not configured.');
    }

    const formData = new FormData();
    formData.append('model', 'muse-voice-transcribe-1.0');
    formData.append('processing_mode', 'DIARIZATION');
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'recording.wav');

    const res = await fetch(`${this.baseUrl}/asr/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      this.budgetGuard.recordUsage({ model: 'muse-voice-transcribe-1.0', endpoint: '/v1/asr/transcribe', estimated_cost_usd: 0 }, 'ERROR');
      throw new Error(`Voice Transcribe Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    this.budgetGuard.recordUsage({
      model: 'muse-voice-transcribe-1.0',
      endpoint: '/v1/asr/transcribe',
      audio_seconds: durationSeconds,
      estimated_cost_usd: costUsd,
    });

    const result: VoiceTranscribeResult = {
      text: data.text || '',
      duration_seconds: durationSeconds,
      segments: data.segments || [],
    };

    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    return result;
  }
}
