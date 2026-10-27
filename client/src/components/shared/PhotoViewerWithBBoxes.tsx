import type { VisualFinding } from '../../lib/types';
import { bboxToStyle } from '../../lib/format';
import { Crosshair } from 'lucide-react';

interface PhotoViewerProps {
  photoIndex: number;
  findings: VisualFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  compact?: boolean;
}

export function PhotoViewerWithBBoxes({
  photoIndex,
  findings,
  selectedFindingId,
  onSelectFinding,
  compact = false,
}: PhotoViewerProps) {
  const visibleFindings = findings.filter((f) => f.photo_index === photoIndex);
  const activeFinding = visibleFindings.find((f) => f.finding_id === selectedFindingId) || visibleFindings[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Photo Frame Container */}
      <div className={`relative overflow-hidden border border-stone-300 bg-[#E7E2D9] ${compact ? 'aspect-[4/3] w-full' : 'aspect-[16/10] w-full'}`}>
        {/* Schematic illustration */}
        {photoIndex === 1 ? (
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Baño con filtración en cielo">
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
            <text x="16" y="285" fontSize="11" fill="#78716c" fontFamily="sans-serif">
              Foto 1 · Baño · cielo sobre tina con filtración
            </text>
          </svg>
        ) : (
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Living con pozo de luz">
            <rect width="400" height="300" fill="#e7e2d9" />
            <rect x="60" y="36" width="120" height="190" fill="#57534e" />
            <rect x="70" y="46" width="100" height="170" fill="#292524" />
            <line x1="120" y1="46" x2="120" y2="216" stroke="#78716c" strokeWidth="3" />
            <line x1="70" y1="130" x2="170" y2="130" stroke="#78716c" strokeWidth="3" />
            <rect x="210" y="60" width="140" height="170" rx="4" fill="#f4f1ea" stroke="#b9b2a5" strokeWidth="2" />
            <rect x="225" y="80" width="110" height="60" fill="#d6d0c7" />
            <rect x="225" y="150" width="110" height="60" fill="#d6d0c7" />
            <text x="16" y="285" fontSize="11" fill="#78716c" fontFamily="sans-serif">
              Foto 0 · Living · ventana a pozo de luz interior
            </text>
          </svg>
        )}

        {/* 0-1000 Perception Grounding BBoxes */}
        {visibleFindings.map((finding) => {
          const isSelected = finding.finding_id === selectedFindingId;
          const style = bboxToStyle(finding.bbox_1000);
          const isCritical = finding.severity === 'CRITICAL';

          return (
            <button
              key={finding.finding_id}
              onClick={() => onSelectFinding(finding.finding_id)}
              style={style}
              className={`absolute cursor-pointer border-2 transition-all ${
                isCritical
                  ? isSelected
                    ? 'border-[#B91C1C] bg-[#B91C1C]/25 ring-2 ring-[#B91C1C]'
                    : 'border-[#B91C1C] bg-[#B91C1C]/15 hover:bg-[#B91C1C]/25'
                  : isSelected
                    ? 'border-[#B45309] bg-[#B45309]/25 ring-2 ring-[#B45309]'
                    : 'border-[#B45309] bg-[#B45309]/15 hover:bg-[#B45309]/25'
              }`}
              title={finding.object_or_defect_label}
              aria-label={`Hallazgo visual: ${finding.object_or_defect_label}`}
            >
              <span
                className={`tnum absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white ${
                  isCritical ? 'bg-[#B91C1C]' : 'bg-[#B45309]'
                }`}
              >
                {finding.severity}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Finding Detail Banner */}
      {activeFinding && (
        <div className="border border-stone-200 bg-[#FAF8F5] p-3 text-[12px]">
          <div className="flex items-center gap-1.5 font-bold text-[#111827]">
            <Crosshair size={13} className={activeFinding.severity === 'CRITICAL' ? 'text-[#B91C1C]' : 'text-[#B45309]'} />
            <span>{activeFinding.object_or_defect_label}</span>
          </div>
          <p className="mt-1 text-stone-600 leading-relaxed">{activeFinding.visual_explanation}</p>
          <p className="tnum mt-1 text-[11px] text-stone-500 font-mono">
            BBox: [{activeFinding.bbox_1000.x_min}, {activeFinding.bbox_1000.y_min}, {activeFinding.bbox_1000.x_max}, {activeFinding.bbox_1000.y_max}]
          </p>
        </div>
      )}
    </div>
  );
}
