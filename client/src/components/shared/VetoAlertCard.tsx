import type { VetoEvaluationResult } from '../../lib/types';
import { Ban, CheckCircle2 } from 'lucide-react';

interface VetoAlertCardProps {
  veto: VetoEvaluationResult;
}

export function VetoAlertCard({ veto }: VetoAlertCardProps) {
  if (!veto.is_vetoed) {
    return (
      <div className="border border-[#047857] bg-[#FAF8F5] p-3 text-[13px]">
        <div className="flex items-center gap-2 font-bold text-[#047857]">
          <CheckCircle2 size={16} />
          <span>APROBADO PARA REVISIÓN (Sin vetos duros)</span>
        </div>
        <p className="mt-1 text-stone-600 text-[12px]">
          La propiedad cumple las restricciones booleanas y el presupuesto máximo.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#B91C1C] bg-white p-4">
      <div className="flex items-center gap-2 font-bold text-[#B91C1C] text-[14px]">
        <Ban size={18} className="shrink-0" />
        <span>VETO DURO: {veto.verdict}</span>
      </div>
      <p className="mt-1 text-[12px] font-semibold text-[#111827]">
        Esta propiedad viola reglas críticas no negociables de tu perfil:
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 text-[12px] text-stone-700">
        {veto.reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="font-bold text-[#B91C1C] shrink-0">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
