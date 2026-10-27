import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  FlaskConical,
  Loader2,
  MapPin,
  Radio,
  Send,
  TriangleAlert,
} from 'lucide-react';
import PanelCostProfile from './components/PanelCostProfile';
import PanelXray from './components/PanelXray';
import PanelVerdict from './components/PanelVerdict';
import { auditListing, getHealth, loadSampleCase } from './lib/api';
import type { RenterProfile, WorkbenchCase } from './lib/types';

type Status = 'empty' | 'loading' | 'ready' | 'error';

const DEFAULT_PROFILE: RenterProfile = {
  max_total_monthly_budget_clp: 680000,
  requires_pet_friendly: true,
  requires_washer_connection: true,
  requires_direct_natural_light: true,
  max_minutes_to_metro: 15,
  preferred_communes: ['Providencia', 'Ñuñoa'],
};

export default function App() {
  const [workbench, setWorkbench] = useState<WorkbenchCase | null>(null);
  const [status, setStatus] = useState<Status>('empty');
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<'online' | 'offline' | 'checking'>('checking');
  const [listingText, setListingText] = useState('');
  const [showAuditForm, setShowAuditForm] = useState(false);

  useEffect(() => {
    getHealth()
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'));
  }, []);

  const handleLoadSample = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const c = await loadSampleCase();
      setWorkbench(c);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido al cargar el fixture.');
      setStatus('error');
    }
  }, []);

  const handleAudit = useCallback(async () => {
    if (!listingText.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const c = await auditListing(listingText.trim(), DEFAULT_PROFILE);
      setWorkbench(c);
      setStatus('ready');
      setShowAuditForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido al auditar.');
      setStatus('error');
    }
  }, [listingText]);

  // Carga inicial automática del caso Providencia (1 clic = 0 clics al abrir)
  useEffect(() => {
    void handleLoadSample();
  }, [handleLoadSample]);

  return (
    <div className="tnum min-h-screen bg-[#FAF8F5] text-[#111827]">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FAF8F5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center bg-[#111827] font-serif text-[20px] font-bold text-[#FAF8F5]" aria-hidden>
              F
            </span>
            <div>
              <p className="text-[15px] font-bold leading-none tracking-tight">
                FARO <span className="font-serif italic">Rayos-X</span>
              </p>
              <p className="kicker mt-1 text-stone-500">Workbench forense · Providencia</p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span
              className={`tnum flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-bold ${
                health === 'online'
                  ? 'border-[#047857] text-[#047857]'
                  : health === 'offline'
                    ? 'border-[#B91C1C] text-[#B91C1C]'
                    : 'border-stone-300 text-stone-500'
              }`}
              role="status"
            >
              <Radio size={12} aria-hidden />
              API {health === 'checking' ? '…' : health === 'online' ? 'EN LÍNEA' : 'SIN CONEXIÓN'}
            </span>
            <button
              onClick={() => setShowAuditForm((v) => !v)}
              aria-expanded={showAuditForm}
              className="flex items-center gap-1.5 border border-stone-300 bg-white px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-stone-700 transition-colors hover:border-[#111827] hover:text-[#111827] active:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={13} aria-hidden /> Auditar aviso
            </button>
            <button
              onClick={handleLoadSample}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 border border-[#111827] bg-[#111827] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-stone-800 active:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <FlaskConical size={13} aria-hidden />
              )}
              {status === 'loading' ? 'Cargando…' : 'Caso Providencia · 1 clic'}
            </button>
          </div>
        </div>

        {/* Formulario de auditoría */}
        {showAuditForm && (
          <div className="border-t border-stone-200 bg-white">
            <div className="mx-auto max-w-[1500px] px-4 py-3 lg:px-6">
              <label htmlFor="listing-text" className="kicker text-stone-500">
                Pegar aviso nuevo → POST /api/audit
              </label>
              <textarea
                id="listing-text"
                value={listingText}
                onChange={(e) => setListingText(e.target.value)}
                rows={4}
                placeholder={'Ej: Arriendo 2D1B en Ñuñoa, $520.000 + GGCC $60.000, admite mascotas…'}
                className="mt-1.5 w-full border border-stone-300 bg-[#FAF8F5] px-3 py-2 text-[13px] leading-relaxed text-[#111827] placeholder:text-stone-400 focus:border-[#111827] focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAudit}
                  disabled={!listingText.trim() || status === 'loading'}
                  className="flex items-center gap-1.5 border border-[#111827] bg-[#111827] px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-stone-800 active:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                  ) : (
                    <Send size={14} aria-hidden />
                  )}
                  {status === 'loading' ? 'Auditando…' : 'Auditar aviso'}
                </button>
                <p className="tnum text-[11px] text-stone-500">
                  Perfil fijo demo: presupuesto $680.000 · mascota sí · lavadora sí · metro ≤15 min.
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
        {status === 'error' && (
          <div role="alert" className="mb-4 flex gap-2.5 border border-[#B91C1C] bg-white px-4 py-3">
            <TriangleAlert size={17} className="mt-0.5 shrink-0 text-[#B91C1C]" aria-hidden />
            <div>
              <p className="text-[13px] font-bold text-[#B91C1C]">No se pudo conectar a la API local</p>
              <p className="tnum mt-0.5 text-[12px] text-stone-600">
                {error} — Verifica que el backend corra en{' '}
                <code className="bg-stone-100 px-1">http://localhost:3000</code> (
                <code className="bg-stone-100 px-1">npm run dev</code> en la raíz, dist/server.js).
              </p>
              <button
                onClick={handleLoadSample}
                className="mt-2 border border-[#B91C1C] px-3 py-1.5 text-[12px] font-bold text-[#B91C1C] transition-colors hover:bg-[#B91C1C] hover:text-white focus-visible:outline-2 focus-visible:outline-[#B91C1C]"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && !workbench && (
          <div className="flex items-center justify-center gap-2 border border-dashed border-stone-300 bg-white px-4 py-16" role="status">
            <Loader2 size={18} className="animate-spin text-stone-500" aria-hidden />
            <p className="text-[14px] text-stone-600">Cargando evidencia forense…</p>
          </div>
        )}

        {status === 'empty' && !workbench && (
          <div className="border border-dashed border-stone-300 bg-white px-4 py-16 text-center">
            <Building2 size={28} className="mx-auto text-stone-400" aria-hidden />
            <p className="mt-2 text-[15px] font-bold">Sin caso cargado</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-stone-600">
              Pulsa “Caso Providencia · 1 clic” para cargar el fixture (
              <code className="bg-stone-100 px-1">GET /api/fixtures/sample</code>) o audita un
              aviso nuevo.
            </p>
          </div>
        )}

        {workbench && (
          <>
            {/* Cintillo del caso */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#111827] pb-3">
              <div className="min-w-0">
                <p className="kicker text-stone-500">
                  {typeof workbench.listingAd.commune === 'string' ? workbench.listingAd.commune : ''} ·{' '}
                  {workbench.fromCache ? 'fixture / caché' : 'auditoría en vivo'}
                  {workbench.propertyId ? ` · ${workbench.propertyId}` : ''}
                </p>
                <h1 className="mt-1 font-serif text-[24px] font-semibold leading-tight tracking-tight lg:text-[30px]">
                  {'title' in workbench.listingAd ? workbench.listingAd.title : 'Aviso auditado'}
                </h1>
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-stone-500">
                  <MapPin size={12} aria-hidden />
                  {'address_hint' in workbench.listingAd ? workbench.listingAd.address_hint : ''}
                </p>
              </div>
              <p
                className={`tnum border px-2.5 py-1 text-[12px] font-bold ${
                  workbench.veto.is_vetoed
                    ? 'border-[#B91C1C] text-[#B91C1C]'
                    : 'border-[#047857] text-[#047857]'
                }`}
              >
                {workbench.veto.verdict}
              </p>
            </div>

            {/* 3 paneles */}
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[330px_minmax(0,1fr)_370px] xl:grid-cols-[350px_minmax(0,1fr)_400px]">
              <PanelCostProfile workbench={workbench} />
              <PanelXray workbench={workbench} />
              <PanelVerdict workbench={workbench} />
            </div>

            <footer className="tnum mt-6 border-t border-stone-200 pt-3 text-[11px] leading-relaxed text-stone-500">
              FARO Rayos-X · Cálculos deterministas en cliente (réplica de{' '}
              <code className="bg-stone-100 px-1">src/validators/</code>) — el modelo solo extrae,
              nunca calcula. Fuentes: [EXTRACTED_TEXT] [EXTRACTED_PHOTO] [EXTRACTED_PDF] [INFERRED]{' '}
              [CONTRADICTION]. Contraste WCAG AA/AAA ·
              fondo #FAF8F5 · tinta #111827 · sin AI-slop.
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
