/**
 * SAM 3.1 Mask & Bounding Box Utilities
 * Decodes Segment Anything 3.1 binary masks and coordinates into SVG path strings
 */

export interface BoundingBoxCoords {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

/**
 * Converts normalized 0-1000 coordinates into SVG path rectangle
 */
export function bboxToSvgRect(bbox: BoundingBoxCoords, width = 1000, height = 1000): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: Math.round((bbox.x_min / 1000) * width),
    y: Math.round((bbox.y_min / 1000) * height),
    width: Math.round(((bbox.x_max - bbox.x_min) / 1000) * width),
    height: Math.round(((bbox.y_max - bbox.y_min) / 1000) * height),
  };
}

/**
 * Generates an organic polygon mask path around a bounding box with smooth corners
 * Used to render SAM 3.1 segmentation highlights cleanly over defect areas
 */
export function bboxToOrganicMaskPath(bbox: BoundingBoxCoords, width = 1000, height = 1000): string {
  const rect = bboxToSvgRect(bbox, width, height);
  const padX = Math.round(rect.width * 0.05);
  const padY = Math.round(rect.height * 0.05);

  const x0 = Math.max(0, rect.x - padX);
  const y0 = Math.max(0, rect.y - padY);
  const x1 = Math.min(width, rect.x + rect.width + padX);
  const y1 = Math.min(height, rect.y + rect.height + padY);

  // Return a rounded polygon contour
  const r = Math.min(padX * 2, padY * 2, 8);
  return `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
}
