import type { SlideVisual } from '$lib/types';

// Map AI shape types to pptxgenjs shape names
const SHAPE_MAP: Record<string, string> = {
  rectangle: 'rect',
  circle: 'ellipse',
  arrow: 'rightArrow',
  star: 'star5',
  diamond: 'diamond',
  triangle: 'triangle',
  cloud: 'cloud',
  heart: 'heart',
  none: '',
};

// Map position strings to pptxgenjs coordinates (x, y in inches)
// Slide size is 10" x 5.63" (widescreen 16:9)
const POSITION_MAP: Record<string, { x: number; y: number; w: number; h: number }> = {
  background: { x: 0, y: 0, w: 10, h: 5.63 },
  'top-right': { x: 8.0, y: 0.3, w: 1.5, h: 1.5 },
  'bottom-left': { x: 0.5, y: 3.8, w: 1.5, h: 1.5 },
  'center-back': { x: 3.5, y: 1.5, w: 3, h: 3 },
  'left-side': { x: 0.3, y: 1.5, w: 1.2, h: 2.5 },
  'right-side': { x: 8.5, y: 1.5, w: 1.2, h: 2.5 },
};

export interface PptxVisualElement {
  shapeName: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: { color: string };
  opacity?: number;
}

/** Safely convert any value to a hex color string (without #) */
function safeColor(value: unknown, fallback = '636E72'): string {
  if (typeof value !== 'string') return fallback;
  return value.replace('#', '') || fallback;
}

export function visualToShapeConfig(visual: SlideVisual): PptxVisualElement | null {
  const shapeType = typeof visual.shapeType === 'string' ? visual.shapeType : 'none';
  const shapeName = SHAPE_MAP[shapeType] || '';
  if (!shapeName) return null;

  const position = typeof visual.position === 'string' ? visual.position : 'top-right';
  const pos = POSITION_MAP[position] || POSITION_MAP['top-right'];
  const color = safeColor(visual.shapeColor);

  return {
    shapeName,
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: pos.h,
    fill: { color },
    opacity: position === 'background' || position === 'center-back' ? 0.15 : 0.6,
  };
}

export function getBackgroundConfig(
  visual: SlideVisual,
  themeBackgroundColor: string
): { color: string } {
  // pptxgenjs slide.background only supports solid colors (not gradients)
  // If gradient is requested, use the "from" color as the background
  if (visual.backgroundGradient) {
    const from = visual.backgroundGradient.from;
    return { color: safeColor(from, safeColor(themeBackgroundColor, 'F8F9FA')) };
  }

  return { color: safeColor(themeBackgroundColor, 'F8F9FA') };
}
