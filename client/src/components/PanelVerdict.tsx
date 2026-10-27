import { useState } from 'react';
import {
  AlertOctagon,
  Check,
  ChevronDown,
  Copy,
  FileWarning,
  Gauge,
  MessageCircle,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import type { WorkbenchCase } from '../lib/types';
import { copyToClipboard } from '../lib/format';

const STATUS_STYLE: Record<string, { dot: string; chip: string; label: string }> = {
  pass: { dot: 'bg-[#047857]', chip: 'border-[#047857] text-[#047857]', label: 'PASS' },
  fail: { dot: 'bg-[#B91C1C]', chip: 'border-[#B91C1C] text-[#B91C1C]', label: 'FAIL' },
  unknown: { dot: 'bg-[#B45309]', chip: 'border-[#B45309] text-[#B45309]', label: 'UNKNOWN' },
  not_applicable: { dot: 'bg-stone-400', chip: 'border-stone-400 text-stone-500', label: 'N/A' },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handle = async () => {
    setState('loading');
    const ok = await copyToClipboard(text);
    setState(ok ? 'done' : 'error');
    if (ok) window.setTimeout(() => setState('idle'), 2200);
  };

  return (
    <button
      onClick={handle}
      disabled={state === 'loading' || !text}
      aria-live="polite"
      className="flex w-full items-center justify-center gap-2 border border-[#111827] bg-[#111827] px-4 py-2.5 text-[13px] font-bold text-white transition-colors default:bg-[#111827] hover:bg-stone-800 active:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {state === 'done' ? (
        <>
          <Check size={16} aria-hidden /> ¡Copiado al portapapeles!
        </>
      ) : state === 'loading' ? (
        <>Copiando…</>
      ) : state === 'error' ? (
        <>Error al copiar — selecciona el texto manual</>
      ) : (
        <>
          <Copy size={16} aria-hidden /> {label}
        </>
      )}
    </button>
  );
}

export default function PanelVerdict({ workbench }: { workbench: WorkbenchCase }) {
  const { scorecard, audit } = workbench;
  const [openRedlines, setOpenRedlines] = useState<Record<number, boolean>>({ 0: true });
  const whatsapp = audit.tenant_action_pack.whatsapp_broker_questions;

  const tierColor =
    scorecard.transparency_tier === 'ALTA_TRANSPARENCIA'
      ? 'text-[#047857] border-[#047857]'
      : scorecard.transparency_tier === 'OPACIDAD_MODERADA'
        ? 'text-[#B45309] border-[#B45309]'
        : 'text-[#B91C1C] border-[#B91C1C]';

  return (
    <section aria-label="Veredicto, contradicciones y kit de acción" className="flex flex-col gap-4">
      {/* Scorecard dual */}
      <div className="border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <p className="kicker text-stone-500">Panel 03 — Scorecard dual</p>
          <h2 className="mt-1 font-serif text-[19px] font-semibold leading-tight text-[#111827]">
            Calce vs. cobertura
          </h2>
        </div>
        <div className="px-4 py-3">
          <div className="tnum grid grid-cols-2 gap-3">
            <div className="border border-stone-200 bg-[#FAF8F5] px-3 py-2.5 text-center">
              <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                <Gauge size={12} aria-hidden /> Calce verificado
              </p>
              <p className="mt-1 text-[28px] font-bold leading-none text-[#111827]">
                {scorecard.verified_fit_score_100}
                <span className="text-[14px] font-semibold text-stone-500">/100</span>
              </p>
            </div>
            <div className="border border-stone-200 bg-[#FAF8F5] px-3 py-2.5 text-center">
              <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                <FileWarning size={12} aria-hidden /> Cobertura evidencia
              </p>
              <p className="mt-1 text-[28px] font-bold leading-none text-[#111827]">
                {scorecard.evidence_coverage_pct}
                <span className="text-[14px] font-semibold text-stone-500">%</span>
              </p>
            </div>
          </div>
          <p className={`tnum mt-2 border px-2 py-1 text-center text-[12px] font-bold tracking-wide ${tierColor}`}>
            {scorecard.transparency_tier.replaceAll('_', ' ')}
          </p>
          <p className="tnum mt-1.5 text-center text-[11px] text-stone-500">
            {scorecard.checks_summary.passed} pass · {scorecard.checks_summary.failed} fail ·{' '}
            {scorecard.checks_summary.unknown} unknown / {scorecard.checks_summary.total} checks ·{' '}
            Evidencia = (pass+fail)/aplicables × 100
          </p>

          {/* Dimensiones */}
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(scorecard.dimension_scores).map(([dim, s]) => {
              const total = s.pass + s.fail;
              const rate = total > 0 ? s.pass / total : 0.5;
              return (
                <div key={dim}>
                  <div className="tnum flex justify-between text-[11px] font-semibold text-stone-600">
                    <span>
                      {dim} · {s.weight_pct}%
                    </span>
                    <span>
                      {s.pass}✓ {s.fail}✗ {s.unknown}?{' '}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full bg-stone-200" role="img" aria-label={`${dim}: ${s.pass} pass, ${s.fail} fail`}>
                    <div
                      className="h-1.5 bg-[#111827]"
                      style={{ width: `${Math.round(rate * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rúbrica 15 */}
          <details className="group mt-3 border border-stone-200">
            <summary className="cursor-pointer list-none px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#111827]">
              Rúbrica 15 checks — ver detalle
            </summary>
            <ul className="divide-y divide-stone-100 border-t border-stone-200">
              {audit.rubric_15_checks.map((c) => {
                const st = STATUS_STYLE[c.status];
                return (
                  <li key={c.check_code} className="flex items-start gap-2 px-3 py-1.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 ${st.dot}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold leading-snug text-[#111827]">
                        {c.title}{' '}
                        <span className={`tnum ml-1 border px-1 text-[10px] font-bold ${st.chip}`}>
                          {st.label}
                        </span>
                      </p>
                      <p className="tnum truncate text-[11px] text-stone-500">
                        {c.check_code} · {c.dimension} · [{c.provenance_tag}] · {c.evidence_quote_or_coord}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      </div>

      {/* Contradicciones */}
      <div className="border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <p className="kicker text-[#B91C1C]">[Contradiction] · cruce de fuentes</p>
          <h2 className="mt-1 font-serif text-[19px] font-semibold leading-tight text-[#111827]">
            Contradicciones cruzadas ({audit.cross_modal_contradictions.length})
          </h2>
        </div>
        <ul className="flex flex-col gap-2.5 px-4 py-3">
          {audit.cross_modal_contradictions.map((c) => (
            <li key={c.contradiction_id} className="border border-[#B91C1C]/30 bg-[#B91C1C]/[.04] px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <AlertOctagon size={14} className="shrink-0 text-[#B91C1C]" aria-hidden />
                <p className="tnum text-[11px] font-bold tracking-wide text-[#B91C1C]">
                  {c.contradiction_id} · {c.severity} · [{c.contradicting_source}]
                </p>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-[#111827]">
                Aviso promete <q className="font-semibold">“{c.listing_claim_quote}”</q> —{' '}
                {c.contradicting_evidence_detail}
              </p>
              <p className="mt-1 flex gap-1.5 text-[12px] leading-snug text-stone-600">
                <ShieldAlert size={13} className="mt-0.5 shrink-0 text-[#B45309]" aria-hidden />
                <span>Impacto: {c.impact_on_tenant}</span>
              </p>
            </li>
          ))}
        </ul>
        {audit.scam_and_manipulation_signals.length > 0 && (
          <div className="mx-4 mb-3 border border-stone-200 bg-[#FAF8F5] px-3 py-2">
            <p className="kicker mb-1 text-stone-500">Señales de manipulación</p>
            <ul className="flex flex-col gap-1">
              {audit.scam_and_manipulation_signals.map((s, i) => (
                <li key={i} className="text-[12px] leading-snug text-stone-700">• {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Kit de acción */}
      <div className="border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <p className="kicker text-stone-500">Kit de acción del arrendatario</p>
          <h2 className="mt-1 font-serif text-[19px] font-semibold leading-tight text-[#111827]">
            Qué hacer el lunes
          </h2>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-[#047857]" aria-hidden />
            <h3 className="text-[13px] font-bold text-[#111827]">Interrogatorio WhatsApp</h3>
          </div>
          <blockquote className="mt-2 max-h-36 overflow-y-auto border border-stone-200 bg-[#FAF8F5] px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line text-stone-700">
            {whatsapp}
          </blockquote>
          <div className="mt-2">
            <CopyButton text={whatsapp} label="Copiar interrogatorio de WhatsApp" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Scale size={15} className="text-[#111827]" aria-hidden />
            <h3 className="text-[13px] font-bold text-[#111827]">
              Contra-cláusulas legales ({audit.tenant_action_pack.contract_redline_proposals.length})
            </h3>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {audit.tenant_action_pack.contract_redline_proposals.map((r, i) => {
              const open = !!openRedlines[i];
              return (
                <div key={i} className="border border-stone-200">
                  <button
                    onClick={() => setOpenRedlines((prev) => ({ ...prev, [i]: !prev[i] }))}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#111827] active:bg-stone-200"
                  >
                    <span className="text-[12px] font-bold text-[#111827]">{r.original_clause_ref}</span>
                    <ChevronDown
                      size={15}
                      aria-hidden
                      className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open && (
                    <div className="border-t border-stone-200 px-3 py-2">
                      <p className="text-[12px] leading-snug text-[#B91C1C]">
                        <strong>Riesgo:</strong> {r.risk_explanation}
                      </p>
                      <p className="mt-1.5 border-l-2 border-[#047857] bg-[#047857]/5 px-2 py-1.5 text-[12px] leading-relaxed text-[#111827]">
                        <strong>Redline propuesto:</strong> “{r.proposed_replacement_text}”
                      </p>
                      <div className="mt-2">
                        <CopyButton text={r.proposed_replacement_text} label="Copiar redline" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
