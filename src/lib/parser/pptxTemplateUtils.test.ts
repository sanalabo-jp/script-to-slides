import { describe, it, expect } from 'vitest';
import {
	lightenColor,
	resolveFont,
	phToElementStyle,
	mergeStyles,
	buildTemplate,
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
