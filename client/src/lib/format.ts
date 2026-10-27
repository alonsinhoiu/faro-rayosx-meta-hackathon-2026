export function formatCLP(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function formatCLPShort(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

/** Convierte coordenada normalizada 0-1000 a porcentaje CSS. */
export function toPct(v: number): number {
  return v / 10;
}

export function bboxToStyle(bbox: { x_min: number; y_min: number; x_max: number; y_max: number }) {
  return {
    left: `${toPct(bbox.x_min)}%`,
    top: `${toPct(bbox.y_min)}%`,
    width: `${toPct(bbox.x_max - bbox.x_min)}%`,
    height: `${toPct(bbox.y_max - bbox.y_min)}%`,
  } as const;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para contextos sin Clipboard API
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
