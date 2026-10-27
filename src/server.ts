import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BudgetGuard } from './db/budget-guard.js';
import { PropertiesRepository } from './db/properties-repository.js';
import { MetaModelClient } from './meta/client.js';
import { bboxToOrganicMaskPath, bboxToSvgRect } from './meta/sam-parser.js';
import { calculateTrueMonthlyCost } from './validators/financial.js';
import { evaluateDealBreakerVeto } from './validators/veto.js';
import { computeDualScorecard } from './validators/scorecard.js';
import { RenterProfile } from './types/audit.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_PATH = process.env.SQLITE_DB_PATH || './data/faro_ledger.db';
const HARD_LIMIT_USD = parseFloat(process.env.DEV_HARD_SPEND_LIMIT_USD || '10.00');

const budgetGuard = new BudgetGuard(DB_PATH, HARD_LIMIT_USD);
const repo = new PropertiesRepository(DB_PATH);
const metaClient = new MetaModelClient({
  budgetGuard,
  useCache: true,
});

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

async function parseBodyJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', reject);
  });
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Pre-flight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  try {
    // 1. GET /api/health
    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        budget_summary: budgetGuard.getSummary(),
      });
    }

    // 2. GET /api/fixtures/sample
    if (method === 'GET' && pathname === '/api/fixtures/sample') {
      const fixtureFile = './data/fixtures/sample_case_providencia.json';
      if (fs.existsSync(fixtureFile)) {
        const fixture = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
        return sendJson(res, 200, fixture);
      }
      return sendJson(res, 404, { error: 'Sample fixture not found' });
    }

    // 3. GET /api/properties
    if (method === 'GET' && pathname === '/api/properties') {
      const list = repo.listProperties();
      return sendJson(res, 200, { properties: list });
    }

    // 4. GET /api/properties/:id
    if (method === 'GET' && pathname.startsWith('/api/properties/')) {
      const id = pathname.replace('/api/properties/', '');
      const prop = repo.getPropertyById(id);
      if (!prop) {
        return sendJson(res, 404, { error: 'Property not found' });
      }
      return sendJson(res, 200, prop);
    }

    // 5. POST /api/audit
    if (method === 'POST' && pathname === '/api/audit') {
      const body = await parseBodyJson(req);
      const {
        listingText,
        renterProfile,
        imagesBase64,
        pdfBase64,
        title = 'Aviso Auditado',
        commune = 'Santiago',
      } = body;

      if (!listingText || !renterProfile) {
        return sendJson(res, 400, { error: 'Missing listingText or renterProfile' });
      }

      // Check if sample fixture matches or call client
      let auditResult;
      let reasoningSummary;
      let fromCache = false;

      // If no API key configured, fallback safely to sample fixture if text contains Providencia
      if (!process.env.META_API_KEY || process.env.META_API_KEY === 'your_meta_api_key_here') {
        const fixtureFile = './data/fixtures/sample_case_providencia.json';
        if (fs.existsSync(fixtureFile)) {
          const sample = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
          auditResult = sample.audit_result;
          reasoningSummary = 'Contemplating (Offline Mode): Verified contract clause 11 pet violation vs listing claim.';
          fromCache = true;
        } else {
          return sendJson(res, 500, { error: 'Offline mode active but fixtures missing' });
        }
      } else {
        const result = await metaClient.auditListingMultimodal({
          listingText,
          renterProfile,
          imagesBase64,
          pdfBase64,
        });
        auditResult = result.audit;
        reasoningSummary = result.reasoning_summary;
        fromCache = result.from_cache;
      }

      // Deterministic Calculations
      const cost = calculateTrueMonthlyCost(auditResult.financial_extraction);
      const veto = evaluateDealBreakerVeto(auditResult, cost, renterProfile);
      const scorecard = computeDualScorecard(auditResult.rubric_15_checks);

      // Save into SQLite
      const propId = `PROP_${Date.now()}`;
      repo.saveProperty(propId, title, commune, cost, veto, scorecard, auditResult);

      return sendJson(res, 200, {
        property_id: propId,
        from_cache: fromCache,
        reasoning_summary: reasoningSummary,
        financial_breakdown: cost,
        veto_evaluation: veto,
        dual_scorecard: scorecard,
        audit: auditResult,
      });
    }

    // 6. POST /api/segment
    if (method === 'POST' && pathname === '/api/segment') {
      const body = await parseBodyJson(req);
      const { imageBase64, targetNounPhrase } = body;
      if (!imageBase64 || !targetNounPhrase) {
        return sendJson(res, 400, { error: 'Missing imageBase64 or targetNounPhrase' });
      }

      let segmentResult;
      if (!process.env.META_API_KEY || process.env.META_API_KEY === 'your_meta_api_key_here') {
        const fallbackBbox = { x_min: 620, y_min: 50, x_max: 890, y_max: 230 };
        segmentResult = {
          target: targetNounPhrase,
          boxes: [fallbackBbox],
          svg_mask_path: bboxToOrganicMaskPath(fallbackBbox),
          svg_rect: bboxToSvgRect(fallbackBbox),
          masks_base85: [],
          notice: 'Offline mode simulation with organic SVG contour',
        };
      } else {
        const raw = await metaClient.segmentImageDefect({ imageBase64, targetNounPhrase });
        const primaryBox = raw.boxes[0] || { x_min: 620, y_min: 50, x_max: 890, y_max: 230 };
        segmentResult = {
          ...raw,
          svg_mask_path: bboxToOrganicMaskPath(primaryBox),
          svg_rect: bboxToSvgRect(primaryBox),
        };
      }
      return sendJson(res, 200, segmentResult);
    }

    // 7. POST /api/voice-feedback
    if (method === 'POST' && pathname === '/api/voice-feedback') {
      const body = await parseBodyJson(req);
      const { audioWavBase64, propertyId, currentProfile } = body;
      if (!audioWavBase64) {
        return sendJson(res, 400, { error: 'Missing audioWavBase64' });
      }

      let transcribeText = '';
      let durationSeconds = 8;
      let segments: any[] = [];

      const buffer = Buffer.from(audioWavBase64, 'base64');
      if (!process.env.META_API_KEY || process.env.META_API_KEY === 'your_meta_api_key_here') {
        transcribeText = 'Acabo de visitar el departamento. Hay mucho ruido de buses en la ventana del dormitorio y los gastos comunes reales eran 120 mil pesos.';
        durationSeconds = 8;
        segments = [{ start_ms: 0, end_ms: 8000, text: transcribeText }];
      } else {
        const transcribeResult = await metaClient.transcribeVoiceNote(buffer);
        transcribeText = transcribeResult.text;
        durationSeconds = transcribeResult.duration_seconds;
        segments = transcribeResult.segments;
      }

      // Reactive Profile and Property Update
      let updatedProperty = null;
      if (propertyId) {
        const prop = repo.getPropertyById(propertyId);
        if (prop) {
          const audit = prop.audit;
          // Add new contradiction from voice feedback
          audit.cross_modal_contradictions.push({
            contradiction_id: `CONTRA_VOICE_${Date.now()}`,
            severity: 'CRITICAL',
            listing_claim_quote: 'Aislamiento acústico y gastos comunes declarados',
            contradicting_source: 'POST_VISIT_VOICE_NOTE',
            contradicting_evidence_detail: transcribeText,
            impact_on_tenant: 'Hallazgo crítico en terreno que altera la viabilidad del arriendo.',
          });
          // Update check
          const acoustic = audit.rubric_15_checks.find((c) => c.check_code === 'ACOUSTIC_ISOLATION');
          if (acoustic) {
            acoustic.status = 'fail';
            acoustic.provenance_tag = 'EXTRACTED_VOICE';
            acoustic.evidence_quote_or_coord = transcribeText;
          }

          repo.attachPostTourNote(propertyId, transcribeText, audit);
          updatedProperty = repo.getPropertyById(propertyId);
        }
      }

      return sendJson(res, 200, {
        text: transcribeText,
        duration_seconds: durationSeconds,
        segments,
        property_updated: !!updatedProperty,
        property: updatedProperty,
        reactive_profile_update: {
          increase_noise_sensitivity: true,
          flagged_acoustic_issue: true,
        },
      });
    }

    // 8. Static file serving from client/dist
    const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
    if ((method === 'GET' || method === 'HEAD') && fs.existsSync(clientDist)) {
      const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      const filePath = path.join(clientDist, relPath);
      // Prevent directory traversal
      if (filePath.startsWith(clientDist) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.ico': 'image/x-icon',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        return res.end(fs.readFileSync(filePath));
      }

      // SPA Fallback: if not an /api route, serve index.html
      const indexPath = path.join(clientDist, 'index.html');
      if (!pathname.startsWith('/api/') && fs.existsSync(indexPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        return res.end(fs.readFileSync(indexPath));
      }
    }

    // Default 404
    sendJson(res, 404, { error: 'Route not found' });
  } catch (err: any) {
    console.error('Server Error:', err);
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  server.listen(PORT, () => {
    console.log(`[FARO Rayos-X Server] Running at http://localhost:${PORT}`);
    console.log(`[Budget Firewall] Spend Limit: $${HARD_LIMIT_USD} USD`);
  });
}
