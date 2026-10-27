import { useMemo, useState } from 'react';
import { Camera, FileText, Crosshair, TriangleAlert } from 'lucide-react';
import type { VisualFinding, WorkbenchCase } from '../lib/types';
import { bboxToStyle } from '../lib/format';

const SEVERITY_STYLE: Record<VisualFinding['severity'], { ring: string; chip: string; label: string }> = {
  CRITICAL: { ring: 'border-[#B91C1C] bg-[#B91C1C]/15', chip: 'bg-[#B91C1C] text-white', label: 'CRÍTICA' },
  HIGH: { ring: 'border-[#B45309] bg-[#B45309]/15', chip: 'bg-[#B45309] text-white', label: 'ALTA' },
  MEDIUM: { ring: 'border-stone-500 bg-stone-500/10', chip: 'bg-stone-700 text-white', label: 'MEDIA' },
  POSITIVE: { ring: 'border-[#047857] bg-[#047857]/15', chip: 'bg-[#047857] text-white', label: 'POSITIVA' },
};

/** Fondo esquemático honesto: el fixture no trae fotos, se dibuja el encuadre descrito. */
function SchematicPhoto({ photoIndex }: { photoIndex: number }) {
  if (photoIndex === 1) {
    // Baño: cielo con mancha de humedad
    return (
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Esquema del baño: cielo con mancha de humedad sobre la tina"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="300" fill="#e7e2d9" />
        <rect x="0" y="0" width="400" height="70" fill="#f4f1ea" />
        <line x1="0" y1="70" x2="400" y2="70" stroke="#b9b2a5" strokeWidth="2" />
        <ellipse cx="300" cy="38" rx="58" ry="20" fill="#c9bfa9" opacity="0.9" />
        <ellipse cx="300" cy="38" rx="34" ry="11" fill="#a89a7d" opacity="0.9" />
        <rect x="40" y="150" width="320" height="110" rx="6" fill="#faf8f5" stroke="#b9b2a5" strokeWidth="2" />
        <rect x="40" y="150" width="320" height="18" fill="#d6d0c7" />
        <rect x="60" y="200" width="60" height="60" fill="#d6d0c7" />
        <rect x="280" y="200" width="60" height="60" fill="#d6d0c7" />
        <line x1="0" y1="150" x2="400" y2="150" stroke="#b9b2a5" strokeWidth="1.5" strokeDasharray="6 5" />
        <text x="20" y="290" fontSize="11" fill="#78716c" fontFamily="sans-serif">
          Esquema — Foto 1 · Baño · cielo sobre tina
        </text>
      </svg>
    );
  }
  // Living: ventana a pozo de luz
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Esquema del living: ventana hacia pozo de luz interior estrecho"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" fill="#e7e2d9" />
      <rect x="60" y="36" width="120" height="190" fill="#57534e" />
      <rect x="70" y="46" width="100" height="170" fill="#292524" />
      <line x1="120" y1="46" x2="120" y2="216" stroke="#78716c" strokeWidth="3" />
      <line x1="70" y1="130" x2="170" y2="130" stroke="#78716c" strokeWidth="3" />
      <rect x="210" y="60" width="140" height="170" rx="4" fill="#f4f1ea" stroke="#b9b2a5" strokeWidth="2" />
      <rect x="225" y="80" width="110" height="60" fill="#d6d0c7" />
      <rect x="225" y="150" width="110" height="60" fill="#d6d0c7" />
      <text x="20" y="290" fontSize="11" fill="#78716c" fontFamily="sans-serif">
        Esquema — Foto 0 · Living · pozo de luz
      </text>
    </svg>
  );
}

export default function PanelXray({ workbench }: { workbench: WorkbenchCase }) {
  const [tab, setTab] = useState<'fotos' | 'contrato'>('fotos');
  const findings = workbench.audit.visual_findings;
  const photoIndexes = useMemo(
    () => Array.from(new Set(findings.map((f) => f.photo_index))).sort((a, b) => a - b),
    [findings],
  );
  const [photo, setPhoto] = useState<number>(photoIndexes[0] ?? 0);
  const [selectedId, setSelectedId] = useState<string | null>(findings[0]?.finding_id ?? null);

  const visible = findings.filter((f) => f.photo_index === photo);
  const selected = findings.find((f) => f.finding_id === selectedId && f.photo_index === photo)
    ?? visible[0]
    ?? null;

  const tabBtn = (active: boolean) =>
    `flex items-center gap-1.5 border px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors default:border-stone-300 default:bg-white default:text-stone-600 hover:border-[#111827] hover:text-[#111827] active:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] disabled:cursor-not-allowed disabled:opacity-50 ${
      active ? 'border-[#111827] bg-[#111827] text-white hover:text-white' : ''
    }`;

  return (
    <section aria-label="Visor Rayos-X y contrato" className="flex min-w-0 flex-col gap-4">
      <div className="border border-stone-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <div>
            <p className="kicker text-stone-500">Panel 02 — Visor Rayos-X</p>
            <h2 className="mt-1 font-serif text-[19px] font-semibold leading-tight text-[#111827]">
              Fotos + contrato, evidencia a evidencia
            </h2>
          </div>
          <div role="tablist" aria-label="Vistas del panel central" className="flex gap-2">
            <button
              role="tab"
              aria-selected={tab === 'fotos'}
              className={tabBtn(tab === 'fotos')}
              onClick={() => setTab('fotos')}
            >
              <Camera size={14} aria-hidden /> Fotos
            </button>
            <button
              role="tab"
              aria-selected={tab === 'contrato'}
              className={tabBtn(tab === 'contrato')}
              onClick={() => setTab('contrato')}
            >
              <FileText size={14} aria-hidden /> Contrato PDF
            </button>
          </div>
        </div>

        {tab === 'fotos' ? (
          <div className="px-4 py-3">
            {/* Selector de foto */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {photoIndexes.map((idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPhoto(idx);
                    const first = findings.find((f) => f.photo_index === idx);
                    setSelectedId(first?.finding_id ?? null);
                  }}
                  aria-pressed={photo === idx}
                  className={`tnum border px-3 py-1.5 text-[12px] font-bold transition-colors hover:border-[#111827] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] active:bg-stone-200 ${
                    photo === idx
                      ? 'border-[#111827] bg-[#111827] text-white'
                      : 'border-stone-300 bg-white text-stone-700'
                  }`}
                >
                  Foto {idx}
                </button>
              ))}
              <span className="tnum ml-auto text-[11px] text-stone-500">
                {visible.length} hallazgo{visible.length === 1 ? '' : 's'} · coords 0–1000
              </span>
            </div>

            {/* Visor */}
            <div className="border border-stone-300 bg-[#e7e2d9]">
              <div className="relative aspect-[4/3] w-full select-none overflow-hidden">
                <SchematicPhoto photoIndex={photo} />
                {visible.map((f) => {
                  const s = bboxToStyle(f.bbox_1000);
                  const isActive = selected?.finding_id === f.finding_id;
                  const sev = SEVERITY_STYLE[f.severity];
                  return (
                    <button
                      key={f.finding_id}
                      onClick={() => setSelectedId(f.finding_id)}
                      onMouseEnter={() => setSelectedId(f.finding_id)}
                      onFocus={() => setSelectedId(f.finding_id)}
                      aria-label={`${f.object_or_defect_label}. Severidad ${f.severity}. Coordenadas ${f.bbox_1000.x_min}, ${f.bbox_1000.y_min}, ${f.bbox_1000.x_max}, ${f.bbox_1000.y_max}.`}
                      className={`group absolute border-2 transition-all hover:z-10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#111827] ${sev.ring} ${
                        isActive ? 'z-10 border-solid opacity-100' : 'border-dashed opacity-90'
                      }`}
                      style={{
                        left: s.left,
                        top: s.top,
                        width: s.width,
                        height: s.height,
                      }}
                    >
                      <span
                        className={`tnum absolute -top-6 left-0 whitespace-nowrap px-1.5 py-0.5 text-[10px] font-bold ${sev.chip}`}
                      >
                        {f.finding_id} · {sev.label}
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Crosshair size={18} className="text-[#111827]" aria-hidden />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="tnum mt-1.5 text-[11px] leading-snug text-stone-500">
              Representación esquemática — el fixture no incluye fotos. Las cajas usan{' '}
              <code className="bg-stone-100 px-1">left: x_min/10%</code>,{' '}
              <code className="bg-stone-100 px-1">top: y_min/10%</code>,{' '}
              <code className="bg-stone-100 px-1">width: (x_max−x_min)/10%</code>,{' '}
              <code className="bg-stone-100 px-1">height: (y_max−y_min)/10%</code>.
            </p>

            {/* Detalle */}
            {selected ? (
              <div className="mt-3 border border-stone-200 bg-[#FAF8F5] px-3 py-2.5" aria-live="polite">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`tnum px-1.5 py-0.5 text-[10px] font-bold ${SEVERITY_STYLE[selected.severity].chip}`}>
                    {selected.severity}
                  </span>
                  <span className="tnum text-[11px] font-semibold text-stone-500">
                    {selected.finding_id} · Foto {selected.photo_index} · bbox [
                    {selected.bbox_1000.x_min}, {selected.bbox_1000.y_min},{' '}
                    {selected.bbox_1000.x_max}, {selected.bbox_1000.y_max}] · [EXTRACTED_PHOTO]
                  </span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-[#111827]">
                  {selected.object_or_defect_label}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-stone-700">
                  {selected.visual_explanation}
                </p>
                <p className="tnum mt-1.5 text-[11px] text-stone-500">
                  SAM-3.1 target: “{selected.sam_target_noun_phrase}” · {selected.category}
                </p>
              </div>
            ) : (
              <p className="mt-3 border border-dashed border-stone-300 px-3 py-4 text-center text-[13px] text-stone-500">
                Sin hallazgos en esta foto.
              </p>
            )}
          </div>
        ) : (
          /* Pestaña contrato */
          <div className="px-4 py-3" role="tabpanel" aria-label="Cláusulas críticas del contrato">
            <p className="tnum mb-3 border border-stone-200 bg-[#FAF8F5] px-3 py-2 text-[12px] leading-snug text-stone-600">
              Borrador de arriendo · Renta {workbench.audit.financial_extraction.contract_rent_clp_or_uf} ·{' '}
              {workbench.audit.financial_extraction.contract_ggcc_clause_quote ?? 'Sin cláusula GGCC citada'} ·
              [EXTRACTED_PDF]
            </p>
            <article className="border border-[#B91C1C] bg-white">
              <header className="flex items-center gap-2 border-b border-[#B91C1C]/20 bg-[#B91C1C]/5 px-3 py-2">
                <TriangleAlert size={15} className="shrink-0 text-[#B91C1C]" aria-hidden />
                <h3 className="text-[13px] font-bold text-[#B91C1C]">
                  Cláusula 11 — Prohibición de mascotas
                </h3>
              </header>
              <p className="px-3 py-2 text-[13px] leading-relaxed text-[#111827]">
                “Se prohíbe <mark className="bg-[#B91C1C]/15 px-0.5 font-semibold">taxativamente la
                tenencia de animales</mark> en la propiedad, bajo multa de{' '}
                <mark className="bg-[#B91C1C]/15 px-0.5 font-semibold">2 UF</mark> por evento y
                facultad de <mark className="bg-[#B91C1C]/15 px-0.5 font-semibold">término
                inmediato del contrato</mark>.” [EXTRACTED_PDF · Cl. 11]
              </p>
            </article>
            <article className="mt-3 border border-[#B45309] bg-white">
              <header className="flex items-center gap-2 border-b border-[#B45309]/20 bg-[#B45309]/5 px-3 py-2">
                <TriangleAlert size={15} className="shrink-0 text-[#B45309]" aria-hidden />
                <h3 className="text-[13px] font-bold text-[#B45309]">
                  Cláusula 14 — Multa por salida anticipada
                </h3>
              </header>
              <p className="px-3 py-2 text-[13px] leading-relaxed text-[#111827]">
                “El término anticipado faculta al arrendador a{' '}
                <mark className="bg-[#B45309]/15 px-0.5 font-semibold">retener hasta 3 meses de
                garantía</mark> como indemnización, aun con aviso previo.” [EXTRACTED_PDF · Cl. 14]
              </p>
            </article>
            <p className="mt-3 text-[12px] leading-snug text-stone-500">
              Trampas resaltadas según rúbrica UNILATERAL_PENALTIES (fail) y PET_POLICY (fail).
              Ver contra-cláusulas en el Kit de Acción →
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
