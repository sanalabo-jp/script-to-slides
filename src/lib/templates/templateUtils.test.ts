import { describe, it, expect } from 'vitest';
import {
	deriveSecondaryFontStyle,
	deriveCallout2,
	createBlankCustomTemplate,
	isValidHexColor,
	resolveUniqueName,
	findElement,
	getPrimaryStyle,
	getSecondaryStyle,
	FONT_FAMILY_PRESETS,
	FONT_WEIGHT_OPTIONS
} from './templateUtils';
import type { ElementFontStyle, TemplateElement } from '$lib/types';

// === deriveSecondaryFontStyle ===

describe('deriveSecondaryFontStyle', () => {
	it('fontColor를 밝게 한다', () => {
		const primary: ElementFontStyle = {
			fontFamily: 'Noto Sans',
			fontSize: 11,
			fontColor: '#434343',
			fontWeight: 700
		};
		const result = deriveSecondaryFontStyle(primary);
		expect(result.fontColor).not.toBe(primary.fontColor);
		const parseHex = (hex: string) => parseInt(hex.replace('#', ''), 16);
		expect(parseHex(result.fontColor)).toBeGreaterThan(parseHex(primary.fontColor));
	});

	it('bold(700)이면 medium(500)으로 낮춘다', () => {
		const primary: ElementFontStyle = {
			fontFamily: 'Noto Sans',
			fontSize: 11,
			fontColor: '#434343',
			fontWeight: 700
		};
		const result = deriveSecondaryFontStyle(primary);
		expect(result.fontWeight).toBe(500);
	});

	it('bold 미만이면 fontWeight를 유지한다', () => {
		const primary: ElementFontStyle = {
			fontFamily: 'Noto Sans',
			fontSize: 11,
			fontColor: '#434343',
			fontWeight: 400
		};
		const result = deriveSecondaryFontStyle(primary);
		expect(result.fontWeight).toBe(400);
	});

	it('fontSize를 유지한다', () => {
		const primary: ElementFontStyle = {
			fontFamily: 'Arial',
			fontSize: 14,
			fontColor: '#000000',
			fontWeight: 700
		};
		const result = deriveSecondaryFontStyle(primary);
		expect(result.fontSize).toBe(14);
	});

	it('fontFamily를 유지한다', () => {
		const primary: ElementFontStyle = {
			fontFamily: 'Gothic',
			fontSize: 12,
			fontColor: '#333333',
			fontWeight: 700
		};
		const result = deriveSecondaryFontStyle(primary);
		expect(result.fontFamily).toBe('Gothic');
	});
});

// === deriveCallout2 (deprecated, backward compat) ===

describe('deriveCallout2', () => {
	it('fontSize를 1pt 줄인다', () => {
		const callout1: ElementFontStyle = {
			fontFamily: 'Noto Sans',
			fontSize: 11,
			fontColor: '#999999',
			fontWeight: 400
		};
		const result = deriveCallout2(callout1);
		expect(result.fontSize).toBe(10);
	});

	it('fontSize 최소값은 7', () => {
		const callout1: ElementFontStyle = {
			fontFamily: 'Arial',
			fontSize: 7,
			fontColor: '#000000',
			fontWeight: 400
		};
		const result = deriveCallout2(callout1);
		expect(result.fontSize).toBe(7);
	});
});

// === findElement / getPrimaryStyle / getSecondaryStyle ===

describe('findElement', () => {
	const elements: TemplateElement[] = [
		{
			name: 'callout1',
			layout: { position: { x: 0, y: 0 }, size: { w: 1, h: 1 }, zIndex: 1 },
			styles: [{ fontFamily: 'Arial', fontSize: 10, fontColor: '#000', fontWeight: 400 }]
		},
		{
			name: 'body',
			layout: { position: { x: 0, y: 1 }, size: { w: 1, h: 1 }, zIndex: 2 },
			styles: [{ fontFamily: 'Arial', fontSize: 12, fontColor: '#333', fontWeight: 500 }]
		}
	];

	it('이름으로 요소를 찾는다', () => {
		const el = findElement(elements, 'callout1');
		expect(el).toBeDefined();
		expect(el!.name).toBe('callout1');
	});

	it('존재하지 않는 요소는 undefined를 반환한다', () => {
		expect(findElement(elements, 'image')).toBeUndefined();
	});
});

describe('getPrimaryStyle / getSecondaryStyle', () => {
	it('styles[0]을 primary로 반환한다', () => {
		const el: TemplateElement = {
			name: 'callout2',
			layout: { position: { x: 0, y: 0 }, size: { w: 1, h: 1 }, zIndex: 1 },
			styles: [
				{ fontFamily: 'Arial', fontSize: 11, fontColor: '#000', fontWeight: 700 },
				{ fontFamily: 'Arial', fontSize: 11, fontColor: '#999', fontWeight: 500 }
			]
		};
		expect(getPrimaryStyle(el)!.fontWeight).toBe(700);
		expect(getSecondaryStyle(el)!.fontWeight).toBe(500);
	});

	it('styles가 비어있으면 undefined를 반환한다', () => {
		const el: TemplateElement = {
			name: 'image',
			layout: { position: { x: 0, y: 0 }, size: { w: 1, h: 1 }, zIndex: 1 },
			styles: []
		};
		expect(getPrimaryStyle(el)).toBeUndefined();
		expect(getSecondaryStyle(el)).toBeUndefined();
	});

	it('styles가 1개면 secondary는 undefined', () => {
		const el: TemplateElement = {
			name: 'body',
			layout: { position: { x: 0, y: 0 }, size: { w: 1, h: 1 }, zIndex: 1 },
			styles: [{ fontFamily: 'Arial', fontSize: 12, fontColor: '#333', fontWeight: 500 }]
		};
		expect(getPrimaryStyle(el)).toBeDefined();
		expect(getSecondaryStyle(el)).toBeUndefined();
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

	it('6개의 elements를 포함한다', () => {
		const template = createBlankCustomTemplate();
		expect(template.elements).toHaveLength(6);
		const names = template.elements.map((e) => e.name);
		expect(names).toContain('callout1');
		expect(names).toContain('callout2');
		expect(names).toContain('title');
		expect(names).toContain('body');
		expect(names).toContain('image');
		expect(names).toContain('caption');
	});

	it('각 텍스트 요소에 primary style이 존재한다', () => {
		const template = createBlankCustomTemplate();
		for (const el of template.elements) {
			if (el.name === 'image') {
				expect(el.styles).toHaveLength(0);
			} else {
				expect(el.styles.length).toBeGreaterThanOrEqual(1);
				expect(el.styles[0].fontFamily).toBeTruthy();
				expect(el.styles[0].fontSize).toBeGreaterThan(0);
			}
		}
	});

	it('callout2에 primary + secondary 2개의 styles가 있다', () => {
		const template = createBlankCustomTemplate();
		const callout2 = findElement(template.elements, 'callout2')!;
		expect(callout2.styles).toHaveLength(2);
		expect(callout2.styles[0].fontWeight).toBe(700); // name: bold
		expect(callout2.styles[1].fontWeight).toBe(500); // role: medium (derived)
	});

	it('각 element에 layout 정보가 있다', () => {
		const template = createBlankCustomTemplate();
		for (const el of template.elements) {
			expect(el.layout.position.x).toBeGreaterThanOrEqual(0);
			expect(el.layout.position.y).toBeGreaterThanOrEqual(0);
			expect(el.layout.size.w).toBeGreaterThan(0);
			expect(el.layout.size.h).toBeGreaterThan(0);
			expect(typeof el.layout.zIndex).toBe('number');
		}
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

// === resolveUniqueName ===

describe('resolveUniqueName', () => {
	it('중복 없으면 원본 이름을 반환한다', () => {
		expect(resolveUniqueName('template', [])).toBe('template');
		expect(resolveUniqueName('template', ['other'])).toBe('template');
	});

	it('중복 시 _1을 붙인다', () => {
		expect(resolveUniqueName('template', ['template'])).toBe('template_1');
	});

	it('연속 중복 시 _2, _3을 붙인다', () => {
		expect(resolveUniqueName('template', ['template', 'template_1'])).toBe('template_2');
		expect(resolveUniqueName('template', ['template', 'template_1', 'template_2'])).toBe(
			'template_3'
		);
	});

	it('template_1의 중복은 template_1_1이 된다', () => {
		expect(resolveUniqueName('template_1', ['template', 'template_1'])).toBe('template_1_1');
	});

	it('빈 이름도 처리한다', () => {
		expect(resolveUniqueName('', [''])).toBe('_1');
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
