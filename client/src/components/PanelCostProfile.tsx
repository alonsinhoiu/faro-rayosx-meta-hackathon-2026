import {
  Ban,
  CircleCheck,
  CircleAlert,
  CircleX,
  PawPrint,
  Sun,
  TrainFront,
  WashingMachine,
  Wallet,
  MapPin,
} from 'lucide-react';
import type { WorkbenchCase } from '../lib/types';
import { formatCLP } from '../lib/format';

function ProfileRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone-200/80 py-2 last:border-0">
      <span className="flex min-w-0 items-center gap-2 text-[13px] text-stone-600">
        <span className="shrink-0 text-stone-500">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`tnum shrink-0 text-[13px] font-semibold ${ok === false ? 'text-[#B91C1C]' : 'text-[#111827]'}`}
      >
        {value}
      </span>
    </div>
  );
}

function CostRow({
  label,
  detail,
  value,
  strong,
}: {
  label: string;
  detail?: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className={`text-[13px] ${strong ? 'font-bold text-[#111827]' : 'text-stone-700'}`}>{label}</p>
        {detail && <p className="text-[11px] leading-snug text-stone-500">{detail}</p>}
      </div>
      <p className={`tnum shrink-0 text-[13px] ${strong ? 'font-bold text-[#111827]' : 'text-stone-800'}`}>
        {value}
      </p>
    </div>
  );
}

export default function PanelCostProfile({ workbench }: { workbench: WorkbenchCase }) {
  const { renterProfile: p, cost, veto } = workbench;

  return (
    <section aria-label="Perfil y costo mensual real" className="flex flex-col gap-4">
      {/* Perfil */}
      <div className="border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <p className="kicker text-stone-500">Panel 01 — Perfil vivo</p>
          <h2 className="mt-1 font-serif text-[19px] font-semibold leading-tight text-[#111827]">
            Arrendatario
          </h2>
        </div>
        <div className="px-4 py-2">
          <ProfileRow
            icon={<Wallet size={15} strokeWidth={2} />}
            label="Presupuesto máximo total"
            value={formatCLP(p.max_total_monthly_budget_clp)}
          />
          <ProfileRow
            icon={<PawPrint size={15} strokeWidth={2} />}
            label="Mascota"
            value={p.requires_pet_friendly ? 'Sí — excluyente' : 'No requerida'}
            ok={!p.requires_pet_friendly ? undefined : undefined}
          />
          <ProfileRow
            icon={<WashingMachine size={15} strokeWidth={2} />}
            label="Conexión lavadora"
            value={p.requires_washer_connection ? 'Sí — excluyente' : 'No requerida'}
          />
          <ProfileRow
            icon={<Sun size={15} strokeWidth={2} />}
            label="Luz natural directa"
            value={p.requires_direct_natural_light ? 'Sí' : 'Indiferente'}
          />
          <ProfileRow
            icon={<TrainFront size={15} strokeWidth={2} />}
            label="Metro máx."
            value={`${p.max_minutes_to_metro} min`}
          />
          <ProfileRow
            icon={<MapPin size={15} strokeWidth={2} />}
            label="Comunas"
            value={p.preferred_communes.join(' · ')}
          />
        </div>
      </div>

      {/* Costo real */}
      <div className="border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <p className="kicker text-stone-500">Costo mensual real · Año 1</p>
          <h2 className="mt-1 font-serif text-[19px] font-semibold leading-tight text-[#111827]">
            Del publicado al real
          </h2>
        </div>
        <div className="px-4 py-3">
          {/* Barra comparativa */}
          <div className="tnum">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Publicado
              </span>
              <span className="text-[13px] font-semibold text-stone-700">
                {formatCLP(cost.base_rent_clp)} CLP
              </span>
            </div>
            <div
              className="mt-1 h-2 w-full bg-stone-200"
              role="img"
              aria-label={`Canon publicado ${formatCLP(cost.base_rent_clp)}`}
            >
              <div
                className="h-2 bg-stone-400"
                style={{
                  width: `${(cost.base_rent_clp / cost.true_monthly_cost_year_one_clp) * 100}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111827]">
                Real verificado
              </span>
              <span className="text-[15px] font-bold text-[#111827]">
                {formatCLP(cost.true_monthly_cost_year_one_clp)} CLP
              </span>
            </div>
            <div
              className="mt-1 h-2.5 w-full bg-stone-200"
              role="img"
              aria-label={`Costo real ${formatCLP(cost.true_monthly_cost_year_one_clp)}, un ${cost.percentage_increase_vs_listed}% más`}
            >
              <div className="h-2.5 w-full bg-[#111827]" />
            </div>
            <p className="mt-1.5 text-right text-[12px] font-semibold text-[#B45309]">
              +{cost.percentage_increase_vs_listed.toLocaleString('es-CL')}% vs. publicado (
              {formatCLP(cost.difference_vs_listed_rent_clp)} más)
            </p>
          </div>

          <div className="mt-2 divide-y divide-stone-100 border-t border-stone-200">
            <CostRow
              label="Canon publicado"
              detail="Aviso"
              value={`${formatCLP(cost.base_rent_clp)} CLP`}
            />
            <CostRow
              label="Gastos comunes"
              detail={
                cost.ggcc_is_estimated
                  ? 'Estimado 15% — no declarado'
                  : 'Declarado en aviso'
              }
              value={`${formatCLP(cost.ggcc_clp)} CLP`}
            />
            <CostRow
              label="Comisión corretaje amortizada"
              detail="50% + IVA ÷ 12 meses"
              value={`${formatCLP(cost.amortized_monthly_broker_fee_clp)}/mes`}
            />
            <CostRow
              label="Amortiguador reajuste UF"
              detail="UF trimestral · IPC 3,8% ref."
              value={`${formatCLP(cost.readjustment_buffer_monthly_clp)}/mes`}
            />
          </div>

          <div className="mt-3 border border-[#111827] bg-[#FAF8F5] px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#111827]">
                Costo mensual real
              </span>
              <span className="tnum text-[18px] font-bold text-[#111827]">
                {formatCLP(cost.true_monthly_cost_year_one_clp)}
              </span>
            </div>
            <p className="tnum mt-0.5 text-right text-[11px] text-stone-500">
              Año 1 · CLP/mes · cálculo determinista, sin IA
            </p>
          </div>
        </div>
      </div>

      {/* VETO DURO */}
      {veto.is_vetoed ? (
        <div
          role="alert"
          aria-live="assertive"
          className="border-2 border-[#B91C1C] bg-white"
        >
          <div className="flex items-center gap-2 bg-[#B91C1C] px-4 py-2.5 text-white">
            <Ban size={17} strokeWidth={2.25} aria-hidden />
            <p className="kicker">Veto duro · no negociable</p>
          </div>
          <div className="px-4 py-3">
            <p className="tnum inline-block border border-[#B91C1C] px-2 py-0.5 text-[12px] font-bold tracking-wide text-[#B91C1C]">
              {veto.verdict}
            </p>
            <ul className="mt-2.5 flex flex-col gap-2">
              {veto.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-[#111827]">
                  <CircleX size={15} className="mt-0.5 shrink-0 text-[#B91C1C]" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-stone-200 pt-2 text-[11px] leading-snug text-stone-500">
              Regla dura: ningún puntaje estético ni argumento del corredor puede anular este
              veredicto. Fuente: rúbrica + contradicciones [CONTRADICTION].
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-[#047857] bg-white">
          <div className="flex items-center gap-2 bg-[#047857] px-4 py-2.5 text-white">
            <CircleCheck size={17} strokeWidth={2.25} aria-hidden />
            <p className="kicker">Apto para revisión</p>
          </div>
          <div className="flex gap-2 px-4 py-3 text-[13px] leading-snug text-[#111827]">
            <CircleAlert size={15} className="mt-0.5 shrink-0 text-[#047857]" aria-hidden />
            <span>
              Sin vetos activos. Veredicto{' '}
              <strong className="tnum">APPROVED_FOR_REVIEW</strong> — continúa a la
              inspección visual y legal.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
