import { describe, it, expect } from 'vitest';
import {
	SLIDE_WIDTH,
	SLIDE_HEIGHT,
	DEFAULT_GRID_SIZE,
	ELEMENT_COLORS,
	ELEMENT_LABELS,
	MIN_ELEMENT_SIZE,
	toPixel,
	toInch,
	clampPosition,
	clampSize,
	snapToGrid,
	computeOverlaps,
	getNextZIndex,
	normalizeZIndexes,
	reorderZIndex,
	mixColors
} from './layoutUtils';
import type { ElementName, TemplateElement } from '$lib/types';

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

// === ELEMENT_LABELS ===

describe('ELEMENT_LABELS', () => {
	it('has entries for all 6 element names', () => {
		const names: ElementName[] = ['callout1', 'callout2', 'title', 'body', 'image', 'caption'];
		for (const name of names) {
			expect(ELEMENT_LABELS[name]).toBeTruthy();
		}
	});

	it('maps element names to data source labels', () => {
		expect(ELEMENT_LABELS.callout1).toBe('metadata');
		expect(ELEMENT_LABELS.callout2).toBe('speaker');
		expect(ELEMENT_LABELS.title).toBe('summary');
		expect(ELEMENT_LABELS.body).toBe('context');
		expect(ELEMENT_LABELS.image).toBe('image');
		expect(ELEMENT_LABELS.caption).toBe('detail');
	});
});

// === computeOverlaps ===

function makeElement(
	name: ElementName,
	x: number,
	y: number,
	w: number,
	h: number,
	zIndex: number,
	enabled?: boolean
): TemplateElement {
	return {
		name,
		layout: { position: { x, y }, size: { w, h }, zIndex },
		styles: [{ fontFamily: 'Noto Sans', fontSize: 14, fontColor: '000000', fontWeight: 400 }],
		enabled
	};
}

describe('computeOverlaps', () => {
	it('returns empty array for empty input', () => {
		expect(computeOverlaps([])).toEqual([]);
	});

	it('detects overlap between elements with different zIndex', () => {
		const elements = [
			makeElement('callout1', 0, 0, 5, 3, 1),
			makeElement('callout2', 2, 1, 5, 3, 2)
		];
		const result = computeOverlaps(elements);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			x: 2,
			y: 1,
			w: 3,
			h: 2,
			elementA: 'callout1',
			elementB: 'callout2'
		});
	});

	it('returns empty array when elements do not overlap', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 1),
			makeElement('callout2', 5, 5, 2, 2, 2)
		];
		expect(computeOverlaps(elements)).toEqual([]);
	});

	it('returns intersection rect for partial overlap', () => {
		const elements = [
			makeElement('callout1', 0, 0, 4, 3, 1),
			makeElement('callout2', 2, 1, 4, 3, 2)
		];
		const result = computeOverlaps(elements);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			x: 2,
			y: 1,
			w: 2,
			h: 2,
			elementA: 'callout1',
			elementB: 'callout2'
		});
	});

	it('returns inner rect for containment', () => {
		const elements = [
			makeElement('callout1', 0, 0, 10, 7, 1),
			makeElement('callout2', 2, 1, 3, 2, 2)
		];
		const result = computeOverlaps(elements);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			x: 2,
			y: 1,
			w: 3,
			h: 2,
			elementA: 'callout1',
			elementB: 'callout2'
		});
	});

	it('returns multiple overlaps: A-B and B-C but not A-C', () => {
		const elements = [
			makeElement('callout1', 0, 0, 3, 2, 1),
			makeElement('callout2', 2, 0, 3, 2, 2),
			makeElement('title', 4, 0, 3, 2, 3)
		];
		const result = computeOverlaps(elements);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			x: 2,
			y: 0,
			w: 1,
			h: 2,
			elementA: 'callout1',
			elementB: 'callout2'
		});
		expect(result).toContainEqual({
			x: 4,
			y: 0,
			w: 1,
			h: 2,
			elementA: 'callout2',
			elementB: 'title'
		});
	});

	it('excludes enabled: false elements', () => {
		const elements = [
			makeElement('callout1', 0, 0, 4, 3, 1, true),
			makeElement('callout2', 2, 1, 4, 3, 2, false)
		];
		expect(computeOverlaps(elements)).toEqual([]);
	});

	it('includes enabled: undefined elements (treated as enabled)', () => {
		const elements = [
			makeElement('callout1', 0, 0, 4, 3, 1, undefined),
			makeElement('callout2', 2, 1, 4, 3, 2, undefined)
		];
		const result = computeOverlaps(elements);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			x: 2,
			y: 1,
			w: 2,
			h: 2,
			elementA: 'callout1',
			elementB: 'callout2'
		});
	});
});

// === mixColors ===

describe('mixColors', () => {
	it('mixes black and white to gray', () => {
		expect(mixColors('#000000', '#ffffff')).toBe('#808080');
	});

	it('returns same color when both inputs are identical', () => {
		expect(mixColors('#94a3b8', '#94a3b8')).toBe('#94a3b8');
	});

	it('mixes two ELEMENT_COLORS correctly', () => {
		// slate-400 (#94a3b8) + zinc-400 (#a1a1aa) → average
		const result = mixColors('#94a3b8', '#a1a1aa');
		// R: (0x94+0xa1)/2 = (148+161)/2 = 154.5 → 155 = 0x9b
		// G: (0xa3+0xa1)/2 = (163+161)/2 = 162 = 0xa2
		// B: (0xb8+0xaa)/2 = (184+170)/2 = 177 = 0xb1
		expect(result).toBe('#9ba2b1');
	});

	it('handles colors without # prefix', () => {
		expect(mixColors('000000', 'ffffff')).toBe('#808080');
	});

	it('mixes red and blue to purple', () => {
		expect(mixColors('#ff0000', '#0000ff')).toBe('#800080');
	});
});

// === getNextZIndex ===

describe('getNextZIndex', () => {
	it('returns 1 for empty array', () => {
		expect(getNextZIndex([])).toBe(1);
	});

	it('returns 1 when all elements are disabled', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 3, false),
			makeElement('callout2', 0, 0, 2, 2, 5, false)
		];
		expect(getNextZIndex(elements)).toBe(1);
	});

	it('returns max zIndex + 1 for enabled elements', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 3),
			makeElement('callout2', 0, 0, 2, 2, 5)
		];
		expect(getNextZIndex(elements)).toBe(6);
	});

	it('ignores disabled elements', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 3),
			makeElement('callout2', 0, 0, 2, 2, 10, false)
		];
		expect(getNextZIndex(elements)).toBe(4);
	});
});

// === normalizeZIndexes ===

describe('normalizeZIndexes', () => {
	it('normalizes duplicates to dense 1..N', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 1),
			makeElement('callout2', 0, 0, 2, 2, 1),
			makeElement('title', 0, 0, 2, 2, 1),
			makeElement('body', 0, 0, 2, 2, 2),
			makeElement('image', 0, 0, 2, 2, 3),
			makeElement('caption', 0, 0, 2, 2, 3)
		];
		const result = normalizeZIndexes(elements);
		expect(result.map((el) => el.layout.zIndex)).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('preserves order when already normalized', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 1),
			makeElement('callout2', 0, 0, 2, 2, 2),
			makeElement('title', 0, 0, 2, 2, 3)
		];
		const result = normalizeZIndexes(elements);
		expect(result.map((el) => el.layout.zIndex)).toEqual([1, 2, 3]);
	});

	it('ignores disabled elements', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 5),
			makeElement('callout2', 0, 0, 2, 2, 10, false),
			makeElement('title', 0, 0, 2, 2, 8)
		];
		const result = normalizeZIndexes(elements);
		expect(result[0].layout.zIndex).toBe(1); // callout1: z5 → 1
		expect(result[1].layout.zIndex).toBe(10); // callout2: disabled, unchanged
		expect(result[2].layout.zIndex).toBe(2); // title: z8 → 2
	});

	it('does not mutate input array', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 3),
			makeElement('callout2', 0, 0, 2, 2, 1)
		];
		const original = elements.map((el) => el.layout.zIndex);
		normalizeZIndexes(elements);
		expect(elements.map((el) => el.layout.zIndex)).toEqual(original);
	});

	it('handles single enabled element', () => {
		const elements = [makeElement('callout1', 0, 0, 2, 2, 5)];
		const result = normalizeZIndexes(elements);
		expect(result[0].layout.zIndex).toBe(1);
	});
});

// === reorderZIndex ===

describe('reorderZIndex', () => {
	function threeElements() {
		return [
			makeElement('callout1', 0, 0, 2, 2, 1),
			makeElement('callout2', 0, 0, 2, 2, 2),
			makeElement('title', 0, 0, 2, 2, 3)
		];
	}

	it('moves element to rank 1 (lowest)', () => {
		const result = reorderZIndex(threeElements(), 'title', 1);
		// title was 3, now 1. Others shift up.
		expect(result.find((el) => el.name === 'title')!.layout.zIndex).toBe(1);
		expect(result.find((el) => el.name === 'callout1')!.layout.zIndex).toBe(2);
		expect(result.find((el) => el.name === 'callout2')!.layout.zIndex).toBe(3);
	});

	it('moves element to rank N (highest)', () => {
		const result = reorderZIndex(threeElements(), 'callout1', 3);
		expect(result.find((el) => el.name === 'callout1')!.layout.zIndex).toBe(3);
		expect(result.find((el) => el.name === 'callout2')!.layout.zIndex).toBe(1);
		expect(result.find((el) => el.name === 'title')!.layout.zIndex).toBe(2);
	});

	it('moves element to middle rank', () => {
		const result = reorderZIndex(threeElements(), 'title', 2);
		expect(result.find((el) => el.name === 'callout1')!.layout.zIndex).toBe(1);
		expect(result.find((el) => el.name === 'title')!.layout.zIndex).toBe(2);
		expect(result.find((el) => el.name === 'callout2')!.layout.zIndex).toBe(3);
	});

	it('clamps rank < 1 to 1', () => {
		const result = reorderZIndex(threeElements(), 'callout2', -5);
		expect(result.find((el) => el.name === 'callout2')!.layout.zIndex).toBe(1);
	});

	it('clamps rank > N to N', () => {
		const result = reorderZIndex(threeElements(), 'callout1', 100);
		expect(result.find((el) => el.name === 'callout1')!.layout.zIndex).toBe(3);
	});

	it('returns unchanged when element not found', () => {
		const elements = threeElements();
		const result = reorderZIndex(elements, 'image', 1);
		expect(result).toBe(elements);
	});

	it('handles single enabled element', () => {
		const elements = [makeElement('callout1', 0, 0, 2, 2, 1)];
		const result = reorderZIndex(elements, 'callout1', 1);
		expect(result[0].layout.zIndex).toBe(1);
	});

	it('does not affect disabled elements', () => {
		const elements = [
			makeElement('callout1', 0, 0, 2, 2, 1),
			makeElement('callout2', 0, 0, 2, 2, 2),
			makeElement('title', 0, 0, 2, 2, 99, false)
		];
		const result = reorderZIndex(elements, 'callout1', 2);
		expect(result.find((el) => el.name === 'title')!.layout.zIndex).toBe(99);
		expect(result.find((el) => el.name === 'callout2')!.layout.zIndex).toBe(1);
		expect(result.find((el) => el.name === 'callout1')!.layout.zIndex).toBe(2);
	});
});
