import { useState } from 'react';
import type { WorkbenchCase } from '../../lib/types';
import { PhotoViewerWithBBoxes } from '../shared/PhotoViewerWithBBoxes';
import { CostBreakdownCard } from '../shared/CostBreakdownCard';
import { VetoAlertCard } from '../shared/VetoAlertCard';
import { WhatsAppButton } from '../shared/WhatsAppButton';
import {
  Camera,
  DollarSign,
  Gauge,
  MessageSquare,
  AlertTriangle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { formatCLP } from '../../lib/format';

type MobileTab = 'xray' | 'costo' | 'scorecard' | 'accion';

export function MobileTenantView({ workbench }: { workbench: WorkbenchCase }) {
  const { renterProfile: p, cost, veto, scorecard, audit, listingAd } = workbench;
  const [activeTab, setActiveTab] = useState<MobileTab>('xray');
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    audit.visual_findings[0]?.finding_id || null
  );
  const [checkFilter, setCheckFilter] = useState<'ALL' | 'FAIL' | 'UNKNOWN'>('ALL');
  const [openRedlines, setOpenRedlines] = useState<Record<number, boolean>>({ 0: true });

  const toggleRedline = (i: number) => {
    setOpenRedlines((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const filteredChecks = audit.rubric_15_checks.filter((c) => {
    if (checkFilter === 'FAIL') return c.status === 'fail';
    if (checkFilter === 'UNKNOWN') return c.status === 'unknown';
    return true;
  });

  return (
    <div className="flex flex-col pb-24 text-[#111827]">
      {/* Mobile Top Header */}
      <div className="sticky top-[57px] z-20 border-b border-stone-200 bg-[#FAF8F5]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="kicker text-stone-500">{listingAd.commune} · App Móvil</p>
            <h1 className="truncate font-serif text-[19px] font-bold tracking-tight text-[#111827]">
              {listingAd.title}
            </h1>
          </div>
          <span
            className={`tnum shrink-0 border px-2 py-0.5 text-[10px] font-bold ${
              veto.is_vetoed ? 'border-[#B91C1C] text-[#B91C1C] bg-red-50' : 'border-[#047857] text-[#047857] bg-emerald-50'
            }`}
          >
            {veto.is_vetoed ? 'VETO DURO' : 'APROBADO'}
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="px-4 py-4">
        {/* TAB 1: RAYOS-X */}
        {activeTab === 'xray' && (
          <div className="flex flex-col gap-4">
            {/* Quick Veto Banner if vetoed */}
            {veto.is_vetoed && <VetoAlertCard veto={veto} />}

            {/* Photo Selector Buttons */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="kicker text-stone-500">Fotos con BBoxes (0-1000)</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setActivePhoto(0); setSelectedFindingId('FIND_01_SHAFT_WINDOW'); }}
                  className={`border px-2.5 py-1 text-[11px] font-bold ${
                    activePhoto === 0 ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  Living (Pozo)
                </button>
                <button
                  onClick={() => { setActivePhoto(1); setSelectedFindingId('FIND_02_CEILING_MOISTURE'); }}
                  className={`border px-2.5 py-1 text-[11px] font-bold ${
                    activePhoto === 1 ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  Baño (Humedad)
                </button>
              </div>
            </div>

            {/* Photo Viewer with BBoxes */}
            <PhotoViewerWithBBoxes
              photoIndex={activePhoto}
              findings={audit.visual_findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={setSelectedFindingId}
              compact
            />

            {/* Contradictions Accordion / Cards */}
            <div className="border border-stone-200 bg-white p-3">
              <p className="kicker text-[#B91C1C] flex items-center gap-1">
                <AlertTriangle size={12} /> Contradicciones Cruzadas ({audit.cross_modal_contradictions.length})
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {audit.cross_modal_contradictions.map((c, i) => (
                  <div key={i} className="border-l-2 border-[#B91C1C] bg-red-50/50 p-2 text-[11px]">
                    <span className="font-bold text-[#111827]">Aviso: "{c.listing_claim_quote}"</span>
                    <p className="text-[#B91C1C] font-semibold mt-0.5">Vs: {c.contradicting_evidence_detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COSTO REAL */}
        {activeTab === 'costo' && (
          <div className="flex flex-col gap-4">
            <CostBreakdownCard cost={cost} maxBudget={p.max_total_monthly_budget_clp} />

            {/* Veto Card */}
            <VetoAlertCard veto={veto} />

            {/* Tenant Rules */}
            <div className="border border-stone-200 bg-white p-3 text-[12px]">
              <p className="kicker text-stone-500 mb-2">Tus Límites Configurados</p>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">Presupuesto Máximo Total</span>
                <span className="tnum font-bold text-[#111827]">{formatCLP(p.max_total_monthly_budget_clp)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">Mascota Excluyente</span>
                <span className="font-bold text-[#111827]">{p.requires_pet_friendly ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-600">Conexión Lavadora</span>
                <span className="font-bold text-[#111827]">{p.requires_washer_connection ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCORECARD */}
        {activeTab === 'scorecard' && (
          <div className="flex flex-col gap-4">
            {/* Dual Score Top Cards */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="border border-stone-200 bg-white p-3">
                <p className="kicker text-stone-500 flex items-center justify-center gap-1">
                  <Gauge size={11} /> Calce Verificado
                </p>
                <p className="tnum text-[28px] font-bold text-[#111827] mt-1">
                  {scorecard.verified_fit_score_100}<span className="text-[13px] text-stone-400 font-normal">/100</span>
                </p>
              </div>
              <div className="border border-stone-200 bg-white p-3">
                <p className="kicker text-stone-500 flex items-center justify-center gap-1">
                  <FileText size={11} /> Evidencia
                </p>
                <p className="tnum text-[28px] font-bold text-[#111827] mt-1">
                  {scorecard.evidence_coverage_pct}<span className="text-[13px] text-stone-400 font-normal">%</span>
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 border-b border-stone-200 pb-2">
              <button
                onClick={() => setCheckFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold border ${checkFilter === 'ALL' ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 bg-white text-stone-600'}`}
              >
                Todos ({audit.rubric_15_checks.length})
              </button>
              <button
                onClick={() => setCheckFilter('FAIL')}
                className={`px-2.5 py-1 text-[11px] font-bold border ${checkFilter === 'FAIL' ? 'border-[#B91C1C] bg-[#B91C1C] text-white' : 'border-stone-200 bg-white text-[#B91C1C]'}`}
              >
                Fallos ({scorecard.checks_summary.failed})
              </button>
              <button
                onClick={() => setCheckFilter('UNKNOWN')}
                className={`px-2.5 py-1 text-[11px] font-bold border ${checkFilter === 'UNKNOWN' ? 'border-[#B45309] bg-[#B45309] text-white' : 'border-stone-200 bg-white text-[#B45309]'}`}
              >
                Dudas ({scorecard.checks_summary.unknown})
              </button>
            </div>

            {/* Filtered Checks List */}
            <div className="flex flex-col gap-2">
              {filteredChecks.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-2 border border-stone-200 bg-white p-2.5 text-[12px]">
                  <div>
                    <span className="font-bold text-[#111827]">{c.title}</span>
                    <p className="text-[11px] text-stone-500 mt-0.5">{c.evidence_quote_or_coord}</p>
                  </div>
                  <span
                    className={`tnum px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${
                      c.status === 'pass'
                        ? 'border-[#047857] text-[#047857] bg-emerald-50'
                        : c.status === 'fail'
                          ? 'border-[#B91C1C] text-[#B91C1C] bg-red-50'
                          : 'border-[#B45309] text-[#B45309] bg-amber-50'
                    }`}
                  >
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KIT WHATSAPP */}
        {activeTab === 'accion' && (
          <div className="flex flex-col gap-4">
            <div className="border border-stone-200 bg-white p-4">
              <p className="kicker text-stone-500 mb-1">Kit de Negociación</p>
              <h2 className="font-serif text-[18px] font-bold text-[#111827] mb-3">Interrogatorio de WhatsApp</h2>

              <WhatsAppButton questionsText={audit.tenant_action_pack.whatsapp_broker_questions} />

              <div className="mt-3 bg-stone-50 border border-stone-200 p-3 text-[11px] text-stone-700 font-mono whitespace-pre-wrap leading-relaxed">
                {audit.tenant_action_pack.whatsapp_broker_questions}
              </div>
            </div>

            {/* Redlines */}
            <div className="border border-stone-200 bg-white p-4">
              <p className="kicker text-stone-500 mb-2">Contra-Cláusulas Sugeridas</p>
              <div className="flex flex-col gap-2">
                {audit.tenant_action_pack.contract_redline_proposals.map((redline, i) => (
                  <div key={i} className="border border-stone-200 text-[11px]">
                    <button
                      onClick={() => toggleRedline(i)}
                      className="flex w-full items-center justify-between bg-stone-50 p-2 text-left font-bold text-stone-800"
                    >
                      <span>{redline.original_clause_ref}</span>
                      <ChevronDown size={14} className={`transform transition-transform ${openRedlines[i] ? 'rotate-180' : ''}`} />
                    </button>
                    {openRedlines[i] && (
                      <div className="p-2.5 bg-white border-t border-stone-200 text-stone-700">
                        <p className="text-stone-500 mb-1">{redline.risk_explanation}</p>
                        <p className="font-mono bg-stone-50 p-1.5 border border-stone-200 text-[#047857]">
                          "{redline.proposed_replacement_text}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-stone-300 bg-white shadow-lg">
        <button
          onClick={() => setActiveTab('xray')}
          className={`flex flex-1 flex-col items-center py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'xray' ? 'text-[#111827] border-t-2 border-[#111827]' : 'text-stone-400'
          }`}
        >
          <Camera size={16} />
          <span className="mt-1">Rayos-X</span>
        </button>
        <button
          onClick={() => setActiveTab('costo')}
          className={`flex flex-1 flex-col items-center py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'costo' ? 'text-[#111827] border-t-2 border-[#111827]' : 'text-stone-400'
          }`}
        >
          <DollarSign size={16} />
          <span className="mt-1">Costo Real</span>
        </button>
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`flex flex-1 flex-col items-center py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'scorecard' ? 'text-[#111827] border-t-2 border-[#111827]' : 'text-stone-400'
          }`}
        >
          <Gauge size={16} />
          <span className="mt-1">Scorecard</span>
        </button>
        <button
          onClick={() => setActiveTab('accion')}
          className={`flex flex-1 flex-col items-center py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'accion' ? 'text-[#111827] border-t-2 border-[#111827]' : 'text-stone-400'
          }`}
        >
          <MessageSquare size={16} />
          <span className="mt-1">WhatsApp</span>
        </button>
      </nav>
    </div>
  );
}
