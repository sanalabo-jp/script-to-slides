import { describe, it, expect } from 'vitest';
import {
	deriveCallout2,
	createBlankCustomTemplate,
	isValidHexColor,
	FONT_FAMILY_PRESETS,
	FONT_WEIGHT_OPTIONS
} from './templateUtils';
import type { ElementStyle } from '$lib/types';

// === deriveCallout2 ===

describe('deriveCallout2', () => {
	it('fontSize를 1pt 줄인다', () => {
		const callout1: ElementStyle = {
			fontFamily: 'Noto Sans',
			fontSize: 11,
			fontColor: '#999999',
			fontWeight: 400
		};
		const result = deriveCallout2(callout1);
		expect(result.fontSize).toBe(10);
	});

	it('fontSize 최소값은 7', () => {
		const callout1: ElementStyle = {
			fontFamily: 'Arial',
			fontSize: 7,
			fontColor: '#000000',
			fontWeight: 400
		};
		const result = deriveCallout2(callout1);
		expect(result.fontSize).toBe(7);
	});

	it('fontColor를 밝게 한다', () => {
		const callout1: ElementStyle = {
			fontFamily: 'Arial',
			fontSize: 11,
			fontColor: '#999999',
			fontWeight: 400
		};
		const result = deriveCallout2(callout1);
		expect(result.fontColor).not.toBe(callout1.fontColor);
		// 밝아진 색상은 원본보다 RGB 값이 크거나 같아야 함
		const parseHex = (hex: string) => parseInt(hex.replace('#', ''), 16);
		expect(parseHex(result.fontColor)).toBeGreaterThan(parseHex(callout1.fontColor));
	});

	it('fontFamily와 fontWeight를 그대로 유지한다', () => {
		const callout1: ElementStyle = {
			fontFamily: 'Gothic',
			fontSize: 12,
			fontColor: '#333333',
			fontWeight: 700
		};
		const result = deriveCallout2(callout1);
		expect(result.fontFamily).toBe('Gothic');
		expect(result.fontWeight).toBe(700);
	});
});

// === createBlankCustomTemplate ===

describe('createBlankCustomTemplate', () => {
	it('유효한 SlideTemplate 구조를 반환한다', () => {
		const template = createBlankCustomTemplate();
		expect(template.id).toMatch(/^custom-/);
		expect(template.name).toBe('Custom Template');
		expect(template.background.color).toBe('#FFFFFF');
	});

	it('모든 스타일 키가 존재한다', () => {
		const template = createBlankCustomTemplate();
		const keys = [
			'titleLabel',
			'bodyLabel',
			'callout1Label',
			'callout2Label',
			'captionLabel'
		] as const;
		for (const key of keys) {
			expect(template.styles[key]).toBeDefined();
			expect(template.styles[key].fontFamily).toBeTruthy();
			expect(template.styles[key].fontSize).toBeGreaterThan(0);
			expect(template.styles[key].fontColor).toMatch(/^#/);
		}
	});

	it('callout2Label은 callout1Label에서 파생된다', () => {
		const template = createBlankCustomTemplate();
		const { callout1Label, callout2Label } = template.styles;
		expect(callout2Label.fontFamily).toBe(callout1Label.fontFamily);
		expect(callout2Label.fontSize).toBeLessThan(callout1Label.fontSize);
	});

	it('매번 고유한 id를 생성한다', () => {
		const a = createBlankCustomTemplate();
		const b = createBlankCustomTemplate();
		expect(a.id).not.toBe(b.id);
	});
});

// === isValidHexColor ===

describe('isValidHexColor', () => {
	it('#RRGGBB 형식을 유효하다고 판정한다', () => {
		expect(isValidHexColor('#FF0000')).toBe(true);
		expect(isValidHexColor('#abc123')).toBe(true);
		expect(isValidHexColor('#000000')).toBe(true);
	});

	it('#RRR 단축 형식을 유효하다고 판정한다', () => {
		expect(isValidHexColor('#FFF')).toBe(true);
		expect(isValidHexColor('#abc')).toBe(true);
	});

	it('# 없는 값을 유효하지 않다고 판정한다', () => {
		expect(isValidHexColor('FF0000')).toBe(false);
	});

	it('잘못된 길이를 유효하지 않다고 판정한다', () => {
		expect(isValidHexColor('#FF00')).toBe(false);
		expect(isValidHexColor('#FF000000')).toBe(false);
	});

	it('비 hex 문자를 유효하지 않다고 판정한다', () => {
		expect(isValidHexColor('#GGGGGG')).toBe(false);
	});

	it('빈 문자열을 유효하지 않다고 판정한다', () => {
		expect(isValidHexColor('')).toBe(false);
	});
});

// === Constants ===

describe('FONT_FAMILY_PRESETS', () => {
	it('10개 프리셋이 있다', () => {
		expect(FONT_FAMILY_PRESETS).toHaveLength(10);
	});

	it('Noto Sans가 포함되어 있다', () => {
		expect(FONT_FAMILY_PRESETS).toContain('Noto Sans');
	});
});

describe('FONT_WEIGHT_OPTIONS', () => {
	it('3개 옵션이 있다 (Regular/Medium/Bold)', () => {
		expect(FONT_WEIGHT_OPTIONS).toHaveLength(3);
	});

	it('각 옵션에 label과 value가 있다', () => {
		for (const opt of FONT_WEIGHT_OPTIONS) {
			expect(opt.label).toBeTruthy();
			expect(typeof opt.value).toBe('number');
		}
	});

	it('400, 500, 700 값을 가진다', () => {
		const values = FONT_WEIGHT_OPTIONS.map((o) => o.value);
		expect(values).toContain(400);
		expect(values).toContain(500);
		expect(values).toContain(700);
	});
});
