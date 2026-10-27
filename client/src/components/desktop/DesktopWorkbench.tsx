import { useState } from 'react';
import type { WorkbenchCase } from '../../lib/types';
import { PhotoViewerWithBBoxes } from '../shared/PhotoViewerWithBBoxes';
import { CostBreakdownCard } from '../shared/CostBreakdownCard';
import { VetoAlertCard } from '../shared/VetoAlertCard';
import { WhatsAppButton } from '../shared/WhatsAppButton';
import {
  Camera,
  FileText,
  Gauge,
  FileWarning,
  AlertTriangle,
  PawPrint,
  WashingMachine,
  Sun,
  Wallet,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { formatCLP } from '../../lib/format';

export function DesktopWorkbench({ workbench }: { workbench: WorkbenchCase }) {
  const { renterProfile: p, cost, veto, scorecard, audit, listingAd } = workbench;
  const [photoTab, setPhotoTab] = useState<'fotos' | 'contrato'>('fotos');
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    audit.visual_findings[0]?.finding_id || null
  );
  const [openRedlines, setOpenRedlines] = useState<Record<number, boolean>>({ 0: true });

  const toggleRedline = (i: number) => {
    setOpenRedlines((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Property Title & Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#111827] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="kicker text-stone-500">{listingAd.commune}</span>
            <span className="text-stone-300">·</span>
            <span className="kicker text-stone-500">Mesa de Control Forense (Desktop)</span>
          </div>
          <h1 className="mt-1 font-serif text-[28px] font-bold text-[#111827] tracking-tight">
            {listingAd.title}
          </h1>
          <p className="flex items-center gap-1 text-[13px] text-stone-500 mt-0.5">
            <MapPin size={13} />
            <span>{listingAd.address_hint || 'Santiago de Chile'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`tnum border px-3 py-1.5 text-[12px] font-bold ${
              veto.is_vetoed ? 'border-[#B91C1C] text-[#B91C1C] bg-red-50' : 'border-[#047857] text-[#047857] bg-emerald-50'
            }`}
          >
            {veto.verdict}
          </div>
        </div>
      </div>

      {/* 3-Column Desktop Grid */}
      <div className="grid grid-cols-[340px_minmax(0,1fr)_390px] items-start gap-5">
        {/* PANEL 1: PERFIL & COSTO REAL */}
        <div className="flex flex-col gap-4">
          {/* Veto Alert */}
          <VetoAlertCard veto={veto} />

          {/* Renter Profile Card */}
          <div className="border border-stone-200 bg-white p-4">
            <p className="kicker text-stone-500">Panel 01 — Perfil del Arrendatario</p>
            <h2 className="font-serif text-[18px] font-bold text-[#111827] mt-1 mb-3">Tus Restricciones Vivas</h2>

            <div className="flex flex-col gap-2.5 text-[12px]">
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="flex items-center gap-2 text-stone-600">
                  <Wallet size={14} className="text-stone-400" /> Presupuesto tope
                </span>
                <span className="tnum font-bold text-[#111827]">{formatCLP(p.max_total_monthly_budget_clp)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="flex items-center gap-2 text-stone-600">
                  <PawPrint size={14} className="text-stone-400" /> Mascota
                </span>
                <span className="font-bold text-[#111827]">{p.requires_pet_friendly ? 'Excluyente' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="flex items-center gap-2 text-stone-600">
                  <WashingMachine size={14} className="text-stone-400" /> Lavadora
                </span>
                <span className="font-bold text-[#111827]">{p.requires_washer_connection ? 'Excluyente' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-stone-600">
                  <Sun size={14} className="text-stone-400" /> Luz natural directa
                </span>
                <span className="font-bold text-[#111827]">{p.requires_direct_natural_light ? 'Sí' : 'Indiferente'}</span>
              </div>
            </div>
          </div>

          {/* Cost Comparison */}
          <CostBreakdownCard cost={cost} maxBudget={p.max_total_monthly_budget_clp} />
        </div>

        {/* PANEL 2: VISOR RAYOS-X & CONTRATO PDF */}
        <div className="border border-stone-200 bg-white">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <div>
              <p className="kicker text-stone-500">Panel 02 — Evidencia Forense</p>
              <h2 className="font-serif text-[18px] font-bold text-[#111827]">Visor Rayos-X Multimodal</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPhotoTab('fotos')}
                className={`flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  photoTab === 'fotos' ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                <Camera size={13} /> Fotos ({audit.visual_findings.length})
              </button>
              <button
                onClick={() => setPhotoTab('contrato')}
                className={`flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  photoTab === 'contrato' ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                <FileText size={13} /> Contrato PDF
              </button>
            </div>
          </div>

          <div className="p-4">
            {photoTab === 'fotos' ? (
              <div className="flex flex-col gap-3">
                {/* Photo Selector */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActivePhoto(0); setSelectedFindingId('FIND_01_SHAFT_WINDOW'); }}
                    className={`border px-3 py-1 text-[11px] font-bold ${
                      activePhoto === 0 ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Foto 0: Living
                  </button>
                  <button
                    onClick={() => { setActivePhoto(1); setSelectedFindingId('FIND_02_CEILING_MOISTURE'); }}
                    className={`border px-3 py-1 text-[11px] font-bold ${
                      activePhoto === 1 ? 'border-[#111827] bg-[#111827] text-white' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Foto 1: Baño (Humedad)
                  </button>
                </div>

                {/* Photo with BBoxes */}
                <PhotoViewerWithBBoxes
                  photoIndex={activePhoto}
                  findings={audit.visual_findings}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={setSelectedFindingId}
                />
              </div>
            ) : (
              /* PDF Lease Clauses Viewer */
              <div className="flex flex-col gap-3 text-[12px]">
                <div className="border border-stone-200 bg-stone-50 p-3">
                  <p className="font-bold text-[#111827] flex items-center gap-1.5">
                    <FileText size={14} /> Borrador de Contrato: borrador_contrato_arriendo.pdf
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Analizado nativamente con Muse Spark 1.3 (input_file)</p>
                </div>

                <div className="border-l-2 border-[#B91C1C] bg-red-50/50 p-3">
                  <span className="tnum kicker text-[#B91C1C]">Cláusula 11 — Prohibición de Mascotas</span>
                  <p className="italic text-stone-800 mt-1 font-serif">
                    "Queda terminantemente prohibida la tenencia o permanencia de cualquier tipo de animal doméstico o mascota en la propiedad, bajo multa de 2 UF por evento y causal inmediata de rescisión."
                  </p>
                  <p className="text-[11px] font-bold text-[#B91C1C] mt-1">
                    ⚡ CONTRADICCIÓN CRÍTICA: El aviso promete "100% pet-friendly".
                  </p>
                </div>

                <div className="border-l-2 border-[#B45309] bg-amber-50/50 p-3">
                  <span className="tnum kicker text-[#B45309]">Cláusula 4 — Reajuste Trimestral en UF</span>
                  <p className="italic text-stone-800 mt-1 font-serif">
                    "La renta se reajustará trimestralmente de acuerdo a la variación acumulada de la Unidad de Fomento (UF) más 2% anual."
                  </p>
                  <p className="text-[11px] font-bold text-[#B45309] mt-1">
                    ⚠️ SOBRECOSTO OCULTO: Agrega ~$10.640 CLP/mes al cálculo real.
                  </p>
                </div>

                <div className="border-l-2 border-[#B91C1C] bg-red-50/50 p-3">
                  <span className="tnum kicker text-[#B91C1C]">Cláusula 14 — Multa por Salida Anticipada</span>
                  <p className="italic text-stone-800 mt-1 font-serif">
                    "En caso de desahucio antes del primer año, el arrendador retendrá la totalidad de la garantía y se exigirá el pago de 3 meses de renta como indemnización."
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: SCORECARD, CONTRADICCIONES & WHATSAPP */}
        <div className="flex flex-col gap-4">
          {/* Dual Scorecard */}
          <div className="border border-stone-200 bg-white p-4">
            <p className="kicker text-stone-500">Panel 03 — Scorecard Dual</p>
            <h2 className="font-serif text-[18px] font-bold text-[#111827] mt-1 mb-3">Calce vs. Transparencia</h2>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="border border-stone-200 bg-[#FAF8F5] p-3">
                <span className="kicker text-stone-500 flex items-center justify-center gap-1">
                  <Gauge size={11} /> Calce Verificado
                </span>
                <p className="tnum text-[28px] font-bold text-[#111827] mt-1">
                  {scorecard.verified_fit_score_100}
                  <span className="text-[14px] text-stone-400 font-normal">/100</span>
                </p>
              </div>
              <div className="border border-stone-200 bg-[#FAF8F5] p-3">
                <span className="kicker text-stone-500 flex items-center justify-center gap-1">
                  <FileWarning size={11} /> Cobertura Evidencia
                </span>
                <p className="tnum text-[28px] font-bold text-[#111827] mt-1">
                  {scorecard.evidence_coverage_pct}
                  <span className="text-[14px] text-stone-400 font-normal">%</span>
                </p>
              </div>
            </div>

            <p className="tnum mt-2.5 border border-[#047857] text-[#047857] text-[11px] font-bold py-1 text-center bg-emerald-50">
              TIER: {scorecard.transparency_tier} ({scorecard.checks_summary.passed} PASS · {scorecard.checks_summary.failed} FAIL · {scorecard.checks_summary.unknown} UNKNOWN)
            </p>
          </div>

          {/* Contradictions Box */}
          <div className="border border-stone-200 bg-white p-4">
            <p className="kicker text-[#B91C1C] flex items-center gap-1">
              <AlertTriangle size={12} /> Contradicciones Cruzadas ({audit.cross_modal_contradictions.length})
            </p>
            <div className="mt-2 flex flex-col gap-2.5">
              {audit.cross_modal_contradictions.map((c, i) => (
                <div key={i} className="border-l-2 border-[#B91C1C] bg-red-50/40 p-2.5 text-[11px]">
                  <p className="font-bold text-[#111827]">
                    Aviso: <span className="line-through text-stone-500">"{c.listing_claim_quote}"</span>
                  </p>
                  <p className="text-[#B91C1C] mt-0.5 font-semibold">
                    Evidencia: {c.contradicting_evidence_detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Pack & WhatsApp */}
          <div className="border border-stone-200 bg-white p-4">
            <p className="kicker text-stone-500">Kit de Acción del Arrendatario</p>
            <h3 className="font-serif text-[16px] font-bold text-[#111827] mt-1 mb-2">Negociación en 1 Clic</h3>

            <WhatsAppButton questionsText={audit.tenant_action_pack.whatsapp_broker_questions} />

            {/* Redlines Accordion */}
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Contra-Cláusulas Legales Sugeridas ({audit.tenant_action_pack.contract_redline_proposals.length})
              </p>
              {audit.tenant_action_pack.contract_redline_proposals.map((redline, i) => (
                <div key={i} className="border border-stone-200 text-[11px]">
                  <button
                    onClick={() => toggleRedline(i)}
                    className="flex w-full items-center justify-between bg-stone-50 p-2 text-left font-bold text-stone-800 hover:bg-stone-100"
                  >
                    <span>{redline.original_clause_ref}</span>
                    <ChevronDown size={14} className={`transform transition-transform ${openRedlines[i] ? 'rotate-180' : ''}`} />
                  </button>
                  {openRedlines[i] && (
                    <div className="p-2.5 bg-white border-t border-stone-200 text-stone-700">
                      <p className="text-stone-500 mb-1">{redline.risk_explanation}</p>
                      <p className="font-mono bg-stone-50 p-1.5 border border-stone-200 text-[#047857] leading-relaxed">
                        "{redline.proposed_replacement_text}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
