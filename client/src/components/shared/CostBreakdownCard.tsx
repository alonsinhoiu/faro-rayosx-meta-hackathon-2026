import { formatCLP } from '../../lib/format';
import type { TrueMonthlyCostResult } from '../../lib/types';
import { ArrowUpRight } from 'lucide-react';

interface CostBreakdownCardProps {
  cost: TrueMonthlyCostResult;
  maxBudget?: number;
}

export function CostBreakdownCard({ cost, maxBudget = 680000 }: CostBreakdownCardProps) {
  const percentAboveListed = cost.percentage_increase_vs_listed;
  const isOverBudget = cost.true_monthly_cost_year_one_clp > maxBudget;

  return (
    <div className="border border-stone-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <p className="kicker text-stone-500">Costo Mensual Real (Año 1)</p>
          <p className="tnum mt-1 text-[26px] font-bold tracking-tight text-[#111827]">
            {formatCLP(cost.true_monthly_cost_year_one_clp)}
            <span className="text-[13px] font-normal text-stone-500"> /mes</span>
          </p>
        </div>
        <div className="text-right">
          <span className="tnum inline-flex items-center gap-0.5 border border-[#B91C1C] px-2 py-0.5 text-[11px] font-bold text-[#B91C1C]">
            <ArrowUpRight size={12} /> +{percentAboveListed}%
          </span>
          <p className="tnum mt-0.5 text-[11px] text-stone-500">vs. publicado</p>
        </div>
      </div>

      {/* Visual comparison bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-bold text-stone-600 mb-1">
          <span>Publicado: {formatCLP(cost.base_rent_clp)}</span>
          <span className={isOverBudget ? 'text-[#B91C1C]' : 'text-[#047857]'}>
            Tope: {formatCLP(maxBudget)}
          </span>
        </div>
        <div className="h-3 w-full bg-stone-100 overflow-hidden flex border border-stone-200">
          <div
            style={{ width: `${Math.min(100, (cost.base_rent_clp / cost.true_monthly_cost_year_one_clp) * 100)}%` }}
            className="bg-[#111827]"
            title="Canon base"
          />
          <div
            style={{ width: `${Math.min(100, (cost.ggcc_clp / cost.true_monthly_cost_year_one_clp) * 100)}%` }}
            className="bg-stone-500"
            title="Gastos comunes"
          />
          <div
            style={{ width: `${Math.min(100, (cost.amortized_monthly_broker_fee_clp / cost.true_monthly_cost_year_one_clp) * 100)}%` }}
            className="bg-stone-400"
            title="Comisión corredor amortizada"
          />
          <div
            style={{ width: `${Math.min(100, (cost.readjustment_buffer_monthly_clp / cost.true_monthly_cost_year_one_clp) * 100)}%` }}
            className="bg-[#B91C1C]"
            title="Reajuste UF buffer"
          />
        </div>
      </div>

      {/* Numerical breakdown */}
      <div className="mt-4 flex flex-col gap-2 text-[12px]">
        <div className="flex justify-between py-1 border-b border-stone-100">
          <span className="text-stone-600">Canon base mensual</span>
          <span className="tnum font-semibold text-[#111827]">{formatCLP(cost.base_rent_clp)}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-stone-100">
          <span className="text-stone-600">
            Gastos comunes {cost.ggcc_is_estimated && <span className="text-[#B45309] font-bold">(estimados)</span>}
          </span>
          <span className="tnum font-semibold text-[#111827]">+{formatCLP(cost.ggcc_clp)}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-stone-100">
          <span className="text-stone-600">Comisión corretaje (50%+IVA ÷ 12)</span>
          <span className="tnum font-semibold text-[#111827]">+{formatCLP(cost.amortized_monthly_broker_fee_clp)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-stone-600">Amortiguador reajuste trimestral UF</span>
          <span className="tnum font-semibold text-[#111827]">+{formatCLP(cost.readjustment_buffer_monthly_clp)}</span>
        </div>
      </div>
    </div>
  );
}
