import type { SlideTemplate, ElementStyle } from '$lib/types';

// === Constants ===

/** schemeClr name → theme1.xml element tag */
export const SCHEME_CLR_MAP: Record<string, string> = {
	dk1: 'a:dk1',
	dk2: 'a:dk2',
	lt1: 'a:lt1',
	lt2: 'a:lt2',
	accent1: 'a:accent1',
	accent2: 'a:accent2',
	accent3: 'a:accent3',
	accent4: 'a:accent4',
	accent5: 'a:accent5',
	accent6: 'a:accent6',
	hlink: 'a:hlink',
	folHlink: 'a:folHlink'
};

export const DEFAULT_FONT = 'Noto Sans';
export const DEFAULT_COLOR = '#434343';

// === Types ===

export interface ThemeData {
	colorScheme: Record<string, string>;
	majorFont: string;
	minorFont: string;
}

export interface PlaceholderStyle {
	type: string;
	fontFamily?: string;
	fontSize?: number;
	fontColor?: string;
	bold?: boolean;
}

export interface ExtractedStyles {
	background: string | null;
	placeholders: PlaceholderStyle[];
}

// === Pure Functions ===

/**
 * Lighten a hex color by a given amount (0-1).
 * Blends each channel toward 255 (white).
 */
export function lightenColor(hex: string, amount: number): string {
	const clean = hex.replace('#', '');
	const r = parseInt(clean.substring(0, 2), 16);
	const g = parseInt(clean.substring(2, 4), 16);
	const b = parseInt(clean.substring(4, 6), 16);

	const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));

	const rr = lighten(r).toString(16).padStart(2, '0');
	const gg = lighten(g).toString(16).padStart(2, '0');
	const bb = lighten(b).toString(16).padStart(2, '0');

	return `#${rr}${gg}${bb}`;
}

/**
 * Resolve OpenXML font reference to actual font name.
 * +mj-lt/+mj-ea → majorFont, +mn-lt/+mn-ea → minorFont.
 */
export function resolveFont(typeface: string, theme: ThemeData): string {
	if (typeface === '+mj-lt' || typeface === '+mj-ea') return theme.majorFont;
	if (typeface === '+mn-lt' || typeface === '+mn-ea') return theme.minorFont;
	return typeface;
}

/**
 * Convert a PlaceholderStyle to an ElementStyle, applying defaults.
 */
export function phToElementStyle(
	ph: PlaceholderStyle | undefined,
	defaults: { fontSize: number; fontColor: string; fontWeight: number },
	theme: ThemeData
): ElementStyle {
	if (!ph) {
		return {
			fontFamily: theme.minorFont || DEFAULT_FONT,
			fontSize: defaults.fontSize,
			fontColor: defaults.fontColor,
			fontWeight: defaults.fontWeight
		};
	}

	return {
		fontFamily: ph.fontFamily || theme.minorFont || DEFAULT_FONT,
		fontSize: ph.fontSize || defaults.fontSize,
		fontColor: ph.fontColor || defaults.fontColor,
		fontWeight: ph.bold ? 700 : defaults.fontWeight
	};
}

/**
 * Merge master and layout styles. Layout overrides master per placeholder type.
 */
export function mergeStyles(master: ExtractedStyles, layouts: ExtractedStyles): ExtractedStyles {
	const background = master.background || layouts.background;

	const phMap = new Map<string, PlaceholderStyle>();

	for (const ph of master.placeholders) {
		phMap.set(ph.type, ph);
	}

	for (const ph of layouts.placeholders) {
		const existing = phMap.get(ph.type);
		if (existing) {
			phMap.set(ph.type, {
				...existing,
				...Object.fromEntries(Object.entries(ph).filter(([, v]) => v !== undefined))
			});
		} else {
			phMap.set(ph.type, ph);
		}
	}

	return { background, placeholders: Array.from(phMap.values()) };
}

/**
 * Build a SlideTemplate from extracted styles and theme data.
 */
export function buildTemplate(
	fileName: string,
	styles: ExtractedStyles,
	theme: ThemeData
): SlideTemplate {
	const phMap = new Map<string, PlaceholderStyle>();
	for (const ph of styles.placeholders) {
		phMap.set(ph.type, ph);
	}

	// 1차: placeholder type 기반 매핑
	const titlePh = phMap.get('title') || phMap.get('ctrTitle');
	const bodyPh = phMap.get('body');
	const subtitlePh = phMap.get('subTitle');
	const captionPh = phMap.get('ftr') || phMap.get('sldNum') || phMap.get('dt');

	// 2차: fontSize 휴리스틱 폴백
	const allPhs = styles.placeholders.filter((p) => p.fontSize !== undefined);
	allPhs.sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0));

	const titleLabel = phToElementStyle(
		titlePh || allPhs[0],
		{ fontSize: 14, fontColor: DEFAULT_COLOR, fontWeight: 700 },
		theme
	);

	const bodyLabel = phToElementStyle(
		bodyPh || allPhs[1],
		{ fontSize: 12, fontColor: DEFAULT_COLOR, fontWeight: 500 },
		theme
	);

	const callout1Label = phToElementStyle(
		subtitlePh || allPhs[2],
		{ fontSize: 11, fontColor: '#999999', fontWeight: 400 },
		theme
	);

	const captionLabel = phToElementStyle(
		captionPh || allPhs[allPhs.length - 1],
		{ fontSize: 9, fontColor: '#C0C0C0', fontWeight: 400 },
		theme
	);

	// callout2Label: callout1에서 파생 (fontSize -1pt, fontColor 밝게)
	const callout2Label: ElementStyle = {
		fontFamily: callout1Label.fontFamily,
		fontSize: Math.max(callout1Label.fontSize - 1, 7),
		fontColor: lightenColor(callout1Label.fontColor, 0.3),
		fontWeight: callout1Label.fontWeight
	};

	const bgColor = styles.background || '#FFFFFF';
	const baseName = fileName.replace(/\.pptx$/i, '');

	return {
		id: `custom-${Date.now()}`,
		name: baseName,
		description: `.pptx에서 추출된 커스텀 템플릿`,
		thumbnail: '',
		background: { color: bgColor },
		styles: {
			callout1Label,
			callout2Label,
			titleLabel,
			bodyLabel,
			captionLabel
		}
	};
}
