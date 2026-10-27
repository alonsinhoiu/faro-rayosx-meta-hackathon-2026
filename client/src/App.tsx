import { useCallback, useEffect, useState } from 'react';
import {
  FlaskConical,
  Loader2,
  Radio,
  Send,
  Smartphone,
  Monitor,
  TriangleAlert,
} from 'lucide-react';
import { DesktopWorkbench } from './components/desktop/DesktopWorkbench';
import { MobileTenantView } from './components/mobile/MobileTenantView';
import { useViewport } from './hooks/useViewport';
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
  const { isMobile, mode, toggleOverride } = useViewport();

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
      setError(e instanceof Error ? e.message : 'Error al cargar el caso de prueba.');
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
      setError(e instanceof Error ? e.message : 'Error al auditar el aviso.');
      setStatus('error');
    }
  }, [listingText]);

  // Carga inicial automática del caso Providencia
  useEffect(() => {
    void handleLoadSample();
  }, [handleLoadSample]);

  return (
    <div className="tnum min-h-screen bg-[#FAF8F5] text-[#111827]">
      {/* Barra superior común */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FAF8F5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center bg-[#111827] font-serif text-[18px] font-bold text-[#FAF8F5]"
              aria-hidden
            >
              F
            </span>
            <div>
              <p className="text-[14px] font-bold leading-none tracking-tight">
                FARO <span className="font-serif italic font-normal">Rayos-X</span>
              </p>
              <p className="kicker mt-0.5 text-[9px] text-stone-500">Auditor Forense de Arriendos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Viewport Mode Switcher Button */}
            <button
              onClick={toggleOverride}
              title="Alternar entre interfaz de escritorio y móvil"
              className="flex items-center gap-1.5 border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 transition-colors hover:border-[#111827] hover:text-[#111827]"
            >
              {isMobile ? <Smartphone size={13} /> : <Monitor size={13} />}
              <span>{isMobile ? 'Vista Móvil' : 'Vista Desktop'}</span>
              <span className="text-[9px] text-stone-400 font-normal">({mode})</span>
            </button>

            {/* Health Badge */}
            <span
              className={`tnum flex items-center gap-1 border px-2 py-1 text-[10px] font-bold ${
                health === 'online'
                  ? 'border-[#047857] text-[#047857] bg-emerald-50'
                  : health === 'offline'
                    ? 'border-[#B91C1C] text-[#B91C1C] bg-red-50'
                    : 'border-stone-300 text-stone-500'
              }`}
            >
              <Radio size={11} />
              {health === 'checking' ? '...' : health === 'online' ? 'API LISTA' : 'OFFLINE'}
            </span>

            {/* Audit Form Toggle */}
            <button
              onClick={() => setShowAuditForm((v) => !v)}
              className="flex items-center gap-1.5 border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-700 hover:border-[#111827]"
            >
              <Send size={12} /> Auditar aviso
            </button>

            {/* 1-Click Providencia Sample Button */}
            <button
              onClick={handleLoadSample}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 border border-[#111827] bg-[#111827] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <FlaskConical size={12} />
              )}
              <span>Providencia (1 clic)</span>
            </button>
          </div>
        </div>

        {/* Formulario para auditar nuevo aviso */}
        {showAuditForm && (
          <div className="border-t border-stone-200 bg-white shadow-inner">
            <div className="mx-auto max-w-[1500px] px-4 py-3 lg:px-6">
              <label htmlFor="listing-text" className="kicker text-stone-500">
                Pegar aviso nuevo → POST /api/audit
              </label>
              <textarea
                id="listing-text"
                value={listingText}
                onChange={(e) => setListingText(e.target.value)}
                rows={3}
                placeholder="Pega aquí el texto completo del aviso inmobiliario (canon, gastos comunes, requisitos, descripción)..."
                className="mt-1 w-full border border-stone-300 bg-[#FAF8F5] p-2.5 text-[12px] text-[#111827] placeholder:text-stone-400 focus:border-[#111827] focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={handleAudit}
                  disabled={!listingText.trim() || status === 'loading'}
                  className="flex items-center gap-1.5 border border-[#111827] bg-[#111827] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  <Send size={12} /> Ejecutar Auditoría Multimodal
                </button>
                <p className="tnum text-[11px] text-stone-500">
                  Límite de presupuesto: $680.000 · Mascota obligatoria · Lavadora obligatoria
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cuerpo principal */}
      <main className="mx-auto max-w-[1500px]">
        {status === 'error' && (
          <div className="m-4 border border-[#B91C1C] bg-white p-4">
            <div className="flex items-center gap-2 font-bold text-[#B91C1C] text-[13px]">
              <TriangleAlert size={16} /> Error de conexión
            </div>
            <p className="tnum mt-1 text-[12px] text-stone-600">
              {error} — Asegúrate de que el backend corra con <code className="bg-stone-100 px-1">npm run dev</code>.
            </p>
          </div>
        )}

        {status === 'loading' && !workbench && (
          <div className="flex items-center justify-center gap-2 p-16 text-stone-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[14px]">Analizando multimodalmente...</span>
          </div>
        )}

        {workbench && (
          <div className="p-4 lg:p-6">
            {isMobile ? (
              <MobileTenantView workbench={workbench} />
            ) : (
              <DesktopWorkbench workbench={workbench} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
