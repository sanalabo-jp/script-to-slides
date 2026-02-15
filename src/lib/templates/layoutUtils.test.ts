import { describe, it, expect } from 'vitest';
import {
	SLIDE_WIDTH,
	SLIDE_HEIGHT,
	DEFAULT_GRID_SIZE,
	ELEMENT_COLORS,
	MIN_ELEMENT_SIZE,
	toPixel,
	toInch,
	clampPosition,
	clampSize,
	snapToGrid
} from './layoutUtils';
import type { ElementName } from '$lib/types';

// === Constants ===

describe('constants', () => {
	it('SLIDE_WIDTH = 13.33, SLIDE_HEIGHT = 7.5', () => {
		expect(SLIDE_WIDTH).toBe(13.33);
		expect(SLIDE_HEIGHT).toBe(7.5);
	});

	it('DEFAULT_GRID_SIZE = 0.1', () => {
		expect(DEFAULT_GRID_SIZE).toBe(0.1);
	});

	it('ELEMENT_COLORS has entries for all 6 element names', () => {
		const names: ElementName[] = ['callout1', 'callout2', 'title', 'body', 'image', 'caption'];
		for (const name of names) {
			expect(ELEMENT_COLORS[name]).toBeTruthy();
		}
	});

	it('MIN_ELEMENT_SIZE has entries for all 6 element names', () => {
		const names: ElementName[] = ['callout1', 'callout2', 'title', 'body', 'image', 'caption'];
		for (const name of names) {
			expect(MIN_ELEMENT_SIZE[name].w).toBeGreaterThan(0);
			expect(MIN_ELEMENT_SIZE[name].h).toBeGreaterThan(0);
		}
	});
});

// === toPixel / toInch ===

describe('toPixel', () => {
	it('inches * scale = pixels', () => {
		expect(toPixel(1, 100)).toBe(100);
		expect(toPixel(2.5, 80)).toBe(200);
	});

	it('0 inches = 0 pixels', () => {
		expect(toPixel(0, 100)).toBe(0);
	});
});

describe('toInch', () => {
	it('pixels / scale = inches (0.01 precision)', () => {
		expect(toInch(100, 100)).toBe(1);
		expect(toInch(200, 80)).toBe(2.5);
	});

	it('0 pixels = 0 inches', () => {
		expect(toInch(0, 100)).toBe(0);
	});

	it('rounds to 0.01 precision', () => {
		// 133 / 100 = 1.33
		expect(toInch(133, 100)).toBe(1.33);
		// 77 / 30 = 2.5666... → 2.57
		expect(toInch(77, 30)).toBe(2.57);
	});
});

// === clampPosition ===

describe('clampPosition', () => {
	it('returns same position when within bounds', () => {
		const result = clampPosition(1, 1, 2, 2);
		expect(result).toEqual({ x: 1, y: 1 });
	});

	it('clamps negative x/y to 0', () => {
		const result = clampPosition(-1, -0.5, 2, 2);
		expect(result).toEqual({ x: 0, y: 0 });
	});

	it('clamps x so element does not overflow right edge', () => {
		// SLIDE_WIDTH=13.33, w=2 → max x = 11.33
		const result = clampPosition(12, 1, 2, 2);
		expect(result.x).toBeCloseTo(11.33, 2);
	});

	it('clamps y so element does not overflow bottom edge', () => {
		// SLIDE_HEIGHT=7.5, h=2 → max y = 5.5
		const result = clampPosition(1, 6, 2, 2);
		expect(result.y).toBe(5.5);
	});

	it('handles element larger than slide (clamps to 0)', () => {
		const result = clampPosition(1, 1, 20, 20);
		expect(result).toEqual({ x: 0, y: 0 });
	});
});

// === clampSize ===

describe('clampSize', () => {
	it('returns same size when above minimum', () => {
		const result = clampSize(5, 3, 1, 0.5);
		expect(result).toEqual({ w: 5, h: 3 });
	});

	it('clamps to minimum when below', () => {
		const result = clampSize(0.3, 0.1, 1, 0.5);
		expect(result).toEqual({ w: 1, h: 0.5 });
	});

	it('clamps to slide dimensions when too large', () => {
		const result = clampSize(20, 15, 1, 0.5);
		expect(result.w).toBe(SLIDE_WIDTH);
		expect(result.h).toBe(SLIDE_HEIGHT);
	});
});

// === snapToGrid ===

describe('snapToGrid', () => {
	it('snaps to nearest 0.1 increment', () => {
		expect(snapToGrid(1.23, 0.1)).toBeCloseTo(1.2, 5);
		expect(snapToGrid(1.25, 0.1)).toBeCloseTo(1.3, 5);
		expect(snapToGrid(1.27, 0.1)).toBeCloseTo(1.3, 5);
	});

	it('already snapped value returns unchanged', () => {
		expect(snapToGrid(1.3, 0.1)).toBeCloseTo(1.3, 5);
	});

	it('snaps 0 correctly', () => {
		expect(snapToGrid(0, 0.1)).toBe(0);
	});

	it('works with custom grid size', () => {
		expect(snapToGrid(1.3, 0.25)).toBeCloseTo(1.25, 5);
		expect(snapToGrid(1.4, 0.25)).toBeCloseTo(1.5, 5);
	});

	it('returns value unchanged when gridSize is 0', () => {
		expect(snapToGrid(1.23, 0)).toBe(1.23);
	});
});
