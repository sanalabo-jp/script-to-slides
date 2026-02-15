import type { ElementName, Position, Size } from '$lib/types';

// === Slide Dimensions (LAYOUT_WIDE: 16:9) ===

export const SLIDE_WIDTH = 13.33; // inches
export const SLIDE_HEIGHT = 7.5; // inches

// === Grid ===

export const DEFAULT_GRID_SIZE = 0.1; // inches

// === Element Colors (gray-spectrum palette for canvas visualization) ===

export const ELEMENT_COLORS: Record<ElementName, string> = {
	callout1: '#94a3b8', // slate-400
	callout2: '#a1a1aa', // zinc-400
	title: '#6b7280', // gray-500
	body: '#78716c', // stone-500
	image: '#9ca3af', // gray-400
	caption: '#a8a29e' // stone-400
};

// === Minimum Element Sizes (inches) ===

export const MIN_ELEMENT_SIZE: Record<ElementName, Size> = {
	callout1: { w: 1.0, h: 0.2 },
	callout2: { w: 1.0, h: 0.2 },
	title: { w: 1.0, h: 0.3 },
	body: { w: 2.0, h: 1.0 },
	image: { w: 1.0, h: 0.75 },
	caption: { w: 1.0, h: 0.2 }
};

// === Coordinate Conversion ===

/** Convert inches to pixels using the given scale factor. */
export function toPixel(inches: number, scale: number): number {
	return inches * scale;
}

/** Convert pixels to inches using the given scale factor. Rounds to 0.01" precision. */
export function toInch(pixels: number, scale: number): number {
	return Math.round((pixels / scale) * 100) / 100;
}

// === Clamping ===

/** Clamp position so the element stays within slide bounds. */
export function clampPosition(x: number, y: number, w: number, h: number): Position {
	const maxX = Math.max(0, SLIDE_WIDTH - w);
	const maxY = Math.max(0, SLIDE_HEIGHT - h);
	return {
		x: Math.round(Math.min(Math.max(0, x), maxX) * 100) / 100,
		y: Math.round(Math.min(Math.max(0, y), maxY) * 100) / 100
	};
}

/** Clamp size between minimum and slide dimensions. */
export function clampSize(w: number, h: number, minW: number, minH: number): Size {
	return {
		w: Math.min(Math.max(w, minW), SLIDE_WIDTH),
		h: Math.min(Math.max(h, minH), SLIDE_HEIGHT)
	};
}

// === Grid Snapping ===

/** Snap a value to the nearest grid increment. Returns value unchanged if gridSize is 0. */
export function snapToGrid(value: number, gridSize: number): number {
	if (gridSize === 0) return value;
	return Math.round(value / gridSize) * gridSize;
}
