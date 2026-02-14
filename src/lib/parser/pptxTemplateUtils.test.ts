// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import {
	lightenColor,
	resolveFont,
	phToElementStyle,
	mergeStyles,
	buildTemplate,
	hexToHsl,
	hslToHexString,
	applyTint,
	applyShade,
	applyLumMod,
	applyLumOff,
	applySatMod,
	applySatOff,
	applyColorModifiers,
	DEFAULT_FONT,
	DEFAULT_COLOR,
	SCHEME_CLR_MAP,
	type ThemeData,
	type PlaceholderStyle,
	type ExtractedStyles
} from './pptxTemplateUtils';

// === Test Helpers ===

const defaultTheme: ThemeData = {
	colorScheme: { dk1: '#000000', lt1: '#FFFFFF' },
	majorFont: 'Arial',
	minorFont: 'Calibri'
};

const emptyTheme: ThemeData = {
	colorScheme: {},
	majorFont: '',
	minorFont: ''
};

// === lightenColor ===

describe('lightenColor', () => {
	it('amount=0 이면 원본 색상을 반환한다', () => {
		expect(lightenColor('#000000', 0)).toBe('#000000');
	});

	it('amount=1 이면 흰색을 반환한다', () => {
		expect(lightenColor('#000000', 1)).toBe('#ffffff');
	});

	it('검은색을 30% 밝게 한다', () => {
		// 0 + (255 - 0) * 0.3 = 76.5 → 77 = 0x4d
		expect(lightenColor('#000000', 0.3)).toBe('#4d4d4d');
	});

	it('회색(#999999)을 30% 밝게 한다', () => {
		// 153 + (255 - 153) * 0.3 = 153 + 30.6 = 183.6 → 184 = 0xb8
		expect(lightenColor('#999999', 0.3)).toBe('#b8b8b8');
	});

	it('# 접두사 없이도 동작한다', () => {
		expect(lightenColor('FF0000', 0.5)).toBe('#ff8080');
	});
});

// === resolveFont ===

describe('resolveFont', () => {
	it('+mj-lt → majorFont로 해석한다', () => {
		expect(resolveFont('+mj-lt', defaultTheme)).toBe('Arial');
	});

	it('+mj-ea → majorFont로 해석한다', () => {
		expect(resolveFont('+mj-ea', defaultTheme)).toBe('Arial');
	});

	it('+mn-lt → minorFont로 해석한다', () => {
		expect(resolveFont('+mn-lt', defaultTheme)).toBe('Calibri');
	});

	it('+mn-ea → minorFont로 해석한다', () => {
		expect(resolveFont('+mn-ea', defaultTheme)).toBe('Calibri');
	});

	it('일반 폰트 이름은 그대로 반환한다', () => {
		expect(resolveFont('Noto Sans', defaultTheme)).toBe('Noto Sans');
	});
});

// === phToElementStyle ===

describe('phToElementStyle', () => {
	const defaults = { fontSize: 14, fontColor: '#434343', fontWeight: 700 };

	it('ph가 undefined이면 theme.minorFont + defaults를 사용한다', () => {
		const result = phToElementStyle(undefined, defaults, defaultTheme);
		expect(result).toEqual({
			fontFamily: 'Calibri',
			fontSize: 14,
			fontColor: '#434343',
			fontWeight: 700
		});
	});

	it('ph가 undefined이고 minorFont가 빈 문자열이면 DEFAULT_FONT를 사용한다', () => {
		const result = phToElementStyle(undefined, defaults, emptyTheme);
		expect(result.fontFamily).toBe(DEFAULT_FONT);
	});

	it('ph의 속성이 있으면 defaults보다 우선한다', () => {
		const ph: PlaceholderStyle = {
			type: 'title',
			fontFamily: 'Gothic',
			fontSize: 28,
			fontColor: '#FF0000'
		};
		const result = phToElementStyle(ph, defaults, defaultTheme);
		expect(result.fontFamily).toBe('Gothic');
		expect(result.fontSize).toBe(28);
		expect(result.fontColor).toBe('#FF0000');
	});

	it('ph.bold=true이면 fontWeight=700', () => {
		const ph: PlaceholderStyle = { type: 'title', bold: true };
		const result = phToElementStyle(
			ph,
			{ fontSize: 12, fontColor: '#000', fontWeight: 400 },
			defaultTheme
		);
		expect(result.fontWeight).toBe(700);
	});

	it('ph에 fontFamily가 없으면 theme.minorFont를 사용한다', () => {
		const ph: PlaceholderStyle = { type: 'body', fontSize: 18 };
		const result = phToElementStyle(ph, defaults, defaultTheme);
		expect(result.fontFamily).toBe('Calibri');
	});
});

// === mergeStyles ===

describe('mergeStyles', () => {
	it('master background 우선', () => {
		const master: ExtractedStyles = { background: '#111111', placeholders: [] };
		const layouts: ExtractedStyles = { background: '#222222', placeholders: [] };
		const result = mergeStyles(master, layouts);
		expect(result.background).toBe('#111111');
	});

	it('master background가 null이면 layout background 사용', () => {
		const master: ExtractedStyles = { background: null, placeholders: [] };
		const layouts: ExtractedStyles = { background: '#222222', placeholders: [] };
		const result = mergeStyles(master, layouts);
		expect(result.background).toBe('#222222');
	});

	it('둘 다 null이면 null', () => {
		const master: ExtractedStyles = { background: null, placeholders: [] };
		const layouts: ExtractedStyles = { background: null, placeholders: [] };
		const result = mergeStyles(master, layouts);
		expect(result.background).toBeNull();
	});

	it('layout placeholder가 master를 오버라이드한다', () => {
		const master: ExtractedStyles = {
			background: null,
			placeholders: [{ type: 'title', fontSize: 24, fontColor: '#000' }]
		};
		const layouts: ExtractedStyles = {
			background: null,
			placeholders: [{ type: 'title', fontSize: 32 }]
		};
		const result = mergeStyles(master, layouts);
		const titlePh = result.placeholders.find((p) => p.type === 'title');
		expect(titlePh?.fontSize).toBe(32);
		expect(titlePh?.fontColor).toBe('#000'); // master 값 유지
	});

	it('새로운 layout placeholder가 추가된다', () => {
		const master: ExtractedStyles = {
			background: null,
			placeholders: [{ type: 'title', fontSize: 24 }]
		};
		const layouts: ExtractedStyles = {
			background: null,
			placeholders: [{ type: 'body', fontSize: 16 }]
		};
		const result = mergeStyles(master, layouts);
		expect(result.placeholders).toHaveLength(2);
	});

	it('빈 placeholders도 정상 처리한다', () => {
		const master: ExtractedStyles = { background: null, placeholders: [] };
		const layouts: ExtractedStyles = { background: null, placeholders: [] };
		const result = mergeStyles(master, layouts);
		expect(result.placeholders).toEqual([]);
	});
});

// === buildTemplate ===

describe('buildTemplate', () => {
	it('파일명에서 .pptx를 제거하여 name으로 사용한다', () => {
		const styles: ExtractedStyles = { background: null, placeholders: [] };
		const result = buildTemplate('my-template.pptx', styles, defaultTheme);
		expect(result.name).toBe('my-template');
	});

	it('id가 custom- 접두사를 가진다', () => {
		const styles: ExtractedStyles = { background: null, placeholders: [] };
		const result = buildTemplate('test.pptx', styles, defaultTheme);
		expect(result.id).toMatch(/^custom-\d+$/);
	});

	it('배경색이 없으면 #FFFFFF을 사용한다', () => {
		const styles: ExtractedStyles = { background: null, placeholders: [] };
		const result = buildTemplate('test.pptx', styles, defaultTheme);
		expect(result.background.color).toBe('#FFFFFF');
	});

	it('배경색이 있으면 그대로 사용한다', () => {
		const styles: ExtractedStyles = { background: '#1A1A2E', placeholders: [] };
		const result = buildTemplate('test.pptx', styles, defaultTheme);
		expect(result.background.color).toBe('#1A1A2E');
	});

	it('placeholder type 기반으로 스타일을 매핑한다', () => {
		const styles: ExtractedStyles = {
			background: null,
			placeholders: [
				{ type: 'title', fontSize: 28, fontColor: '#111', bold: true },
				{ type: 'body', fontSize: 16, fontColor: '#222' },
				{ type: 'subTitle', fontSize: 12, fontColor: '#333' },
				{ type: 'ftr', fontSize: 8, fontColor: '#444' }
			]
		};
		const result = buildTemplate('test.pptx', styles, defaultTheme);
		expect(result.styles.titleLabel.fontSize).toBe(28);
		expect(result.styles.bodyLabel.fontSize).toBe(16);
		expect(result.styles.callout1Label.fontSize).toBe(12);
		expect(result.styles.captionLabel.fontSize).toBe(8);
	});

	it('callout2Label은 callout1에서 파생된다 (fontSize -1, fontColor 밝게)', () => {
		const styles: ExtractedStyles = {
			background: null,
			placeholders: [{ type: 'subTitle', fontSize: 11, fontColor: '#999999' }]
		};
		const result = buildTemplate('test.pptx', styles, defaultTheme);
		expect(result.styles.callout2Label.fontSize).toBe(10);
		expect(result.styles.callout2Label.fontFamily).toBe(result.styles.callout1Label.fontFamily);
		// lightened color should be different from callout1
		expect(result.styles.callout2Label.fontColor).not.toBe(result.styles.callout1Label.fontColor);
	});
});

// === hexToHsl ===

describe('hexToHsl', () => {
	it('검정(#000000) → H=0, S=0, L=0', () => {
		const { h, s, l } = hexToHsl('#000000');
		expect(h).toBe(0);
		expect(s).toBe(0);
		expect(l).toBe(0);
	});

	it('흰색(#FFFFFF) → H=0, S=0, L=1', () => {
		const { h, s, l } = hexToHsl('#FFFFFF');
		expect(h).toBe(0);
		expect(s).toBe(0);
		expect(l).toBe(1);
	});

	it('빨강(#FF0000) → H=0, S=1, L=0.5', () => {
		const { h, s, l } = hexToHsl('#FF0000');
		expect(h).toBe(0);
		expect(s).toBe(1);
		expect(l).toBe(0.5);
	});

	it('회색(#808080) → H=0, S=0, L≈0.502', () => {
		const { h, s, l } = hexToHsl('#808080');
		expect(h).toBe(0);
		expect(s).toBe(0);
		expect(l).toBeCloseTo(0.502, 2);
	});

	it('파랑(#0000FF) → H=240, S=1, L=0.5', () => {
		const { h, s, l } = hexToHsl('#0000FF');
		expect(h).toBe(240);
		expect(s).toBe(1);
		expect(l).toBe(0.5);
	});
});

// === hslToHexString ===

describe('hslToHexString', () => {
	it('H=0, S=0, L=0 → #000000', () => {
		expect(hslToHexString(0, 0, 0)).toBe('#000000');
	});

	it('H=0, S=0, L=1 → #ffffff', () => {
		expect(hslToHexString(0, 0, 1)).toBe('#ffffff');
	});

	it('hexToHsl → hslToHexString 왕복 변환이 일치한다 (#4a7cbf)', () => {
		const original = '#4a7cbf';
		const { h, s, l } = hexToHsl(original);
		const result = hslToHexString(h, s, l);
		// 반올림 오차 ±1 허용
		const origR = parseInt(original.slice(1, 3), 16);
		const origG = parseInt(original.slice(3, 5), 16);
		const origB = parseInt(original.slice(5, 7), 16);
		const resR = parseInt(result.slice(1, 3), 16);
		const resG = parseInt(result.slice(3, 5), 16);
		const resB = parseInt(result.slice(5, 7), 16);
		expect(Math.abs(origR - resR)).toBeLessThanOrEqual(1);
		expect(Math.abs(origG - resG)).toBeLessThanOrEqual(1);
		expect(Math.abs(origB - resB)).toBeLessThanOrEqual(1);
	});
});

// === applyTint ===

describe('applyTint', () => {
	it('fraction=0 이면 원본 그대로', () => {
		expect(applyTint('#000000', 0)).toBe('#000000');
	});

	it('fraction=1 이면 흰색', () => {
		expect(applyTint('#000000', 1)).toBe('#ffffff');
	});

	it('검정에 50% tint → #808080 근처', () => {
		const result = applyTint('#000000', 0.5);
		const r = parseInt(result.slice(1, 3), 16);
		expect(r).toBeCloseTo(128, -1); // ±1 허용
	});
});

// === applyShade ===

describe('applyShade', () => {
	it('fraction=1 이면 원본 그대로', () => {
		expect(applyShade('#FF0000', 1)).toBe('#ff0000');
	});

	it('fraction=0 이면 검정', () => {
		expect(applyShade('#FF0000', 0)).toBe('#000000');
	});

	it('빨강에 50% shade → #800000 근처', () => {
		const result = applyShade('#FF0000', 0.5);
		const r = parseInt(result.slice(1, 3), 16);
		expect(r).toBeCloseTo(128, -1);
	});
});

// === applyLumMod + applyLumOff ===

describe('applyLumMod & applyLumOff', () => {
	it('lumMod=0.5 이면 명도 절반', () => {
		const result = applyLumMod('#808080', 0.5);
		const { l } = hexToHsl(result);
		const originalL = hexToHsl('#808080').l;
		expect(l).toBeCloseTo(originalL * 0.5, 1);
	});

	it('lumOff=0.2 이면 명도 +0.2', () => {
		const result = applyLumOff('#333333', 0.2);
		const { l } = hexToHsl(result);
		const originalL = hexToHsl('#333333').l;
		expect(l).toBeCloseTo(originalL + 0.2, 1);
	});

	it('lumMod + lumOff 조합: 75% mod + 25% off', () => {
		const step1 = applyLumMod('#808080', 0.75);
		const step2 = applyLumOff(step1, 0.25);
		const { l } = hexToHsl(step2);
		const originalL = hexToHsl('#808080').l;
		expect(l).toBeCloseTo(originalL * 0.75 + 0.25, 1);
	});
});

// === applySatMod + applySatOff ===

describe('applySatMod & applySatOff', () => {
	it('satMod=0 이면 채도 0 (회색)', () => {
		const result = applySatMod('#FF0000', 0);
		const { s } = hexToHsl(result);
		expect(s).toBeCloseTo(0, 1);
	});

	it('satOff=0.3 이면 채도 +0.3', () => {
		const result = applySatOff('#808080', 0.3);
		const { s } = hexToHsl(result);
		// 원본 회색은 채도 0이므로 결과 채도 ≈ 0.3
		expect(s).toBeCloseTo(0.3, 1);
	});
});

// === applyColorModifiers ===

describe('applyColorModifiers', () => {
	function mockElement(children: { tagName: string; val: string }[]): Element {
		const parser = new DOMParser();
		let innerXml = '';
		for (const c of children) {
			innerXml += `<${c.tagName} val="${c.val}"/>`;
		}
		const doc = parser.parseFromString(
			`<root xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${innerXml}</root>`,
			'application/xml'
		);
		return doc.documentElement;
	}

	it('modifier가 없으면 원본 반환', () => {
		const el = mockElement([]);
		expect(applyColorModifiers('#FF0000', el)).toBe('#FF0000');
	});

	it('tint modifier 적용', () => {
		const el = mockElement([{ tagName: 'a:tint', val: '50000' }]);
		const result = applyColorModifiers('#000000', el);
		const r = parseInt(result.slice(1, 3), 16);
		expect(r).toBeCloseTo(128, -1);
	});

	it('shade modifier 적용', () => {
		const el = mockElement([{ tagName: 'a:shade', val: '50000' }]);
		const result = applyColorModifiers('#FF0000', el);
		const r = parseInt(result.slice(1, 3), 16);
		expect(r).toBeCloseTo(128, -1);
	});

	it('lumMod + lumOff 조합', () => {
		const el = mockElement([
			{ tagName: 'a:lumMod', val: '75000' },
			{ tagName: 'a:lumOff', val: '25000' }
		]);
		const result = applyColorModifiers('#808080', el);
		const { l } = hexToHsl(result);
		const originalL = hexToHsl('#808080').l;
		expect(l).toBeCloseTo(originalL * 0.75 + 0.25, 1);
	});

	it('alpha modifier는 무시한다', () => {
		const el = mockElement([{ tagName: 'a:alpha', val: '50000' }]);
		expect(applyColorModifiers('#FF0000', el)).toBe('#FF0000');
	});
});

// === Constants ===

describe('constants', () => {
	it('SCHEME_CLR_MAP에 12개 항목이 있다', () => {
		expect(Object.keys(SCHEME_CLR_MAP)).toHaveLength(12);
	});

	it('DEFAULT_FONT은 Noto Sans이다', () => {
		expect(DEFAULT_FONT).toBe('Noto Sans');
	});

	it('DEFAULT_COLOR는 #434343이다', () => {
		expect(DEFAULT_COLOR).toBe('#434343');
	});
});
