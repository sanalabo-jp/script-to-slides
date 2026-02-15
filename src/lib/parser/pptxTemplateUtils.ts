import type { SlideTemplate, ElementFontStyle } from '$lib/types';
import { LECTURE_LAYOUT } from '$lib/templates/presets';
import { deriveSecondaryFontStyle } from '$lib/templates/templateUtils';

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

export interface PptxParseResult {
	template: SlideTemplate;
	warnings: string[];
	isPartial: boolean;
}

// === Color Space Conversion ===

/**
 * Convert hex color to HSL.
 * Returns { h: 0-360, s: 0-1, l: 0-1 }.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const clean = hex.replace('#', '');
	const r = parseInt(clean.substring(0, 2), 16) / 255;
	const g = parseInt(clean.substring(2, 4), 16) / 255;
	const b = parseInt(clean.substring(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) return { h: 0, s: 0, l };

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h: number;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
	else if (max === g) h = ((b - r) / d + 2) * 60;
	else h = ((r - g) / d + 4) * 60;

	return { h, s, l };
}

/**
 * Convert HSL to hex string.
 * h: 0-360, s: 0-1, l: 0-1.
 */
export function hslToHexString(h: number, s: number, l: number): string {
	const clamp = (v: number) => Math.min(1, Math.max(0, v));
	s = clamp(s);
	l = clamp(l);

	if (s === 0) {
		const v = Math.round(l * 255);
		const hex = v.toString(16).padStart(2, '0');
		return `#${hex}${hex}${hex}`;
	}

	const hue2rgb = (p: number, q: number, t: number): number => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const hNorm = h / 360;

	const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
	const g = Math.round(hue2rgb(p, q, hNorm) * 255);
	const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// === OpenXML Color Modifiers ===

function parseHexChannels(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.substring(0, 2), 16),
		parseInt(clean.substring(2, 4), 16),
		parseInt(clean.substring(4, 6), 16)
	];
}

function channelsToHex(r: number, g: number, b: number): string {
	const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
	return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** Tint: blend toward white. fraction 0-1. */
export function applyTint(hex: string, fraction: number): string {
	const [r, g, b] = parseHexChannels(hex);
	return channelsToHex(
		r + (255 - r) * fraction,
		g + (255 - g) * fraction,
		b + (255 - b) * fraction
	);
}

/** Shade: blend toward black. fraction 0-1. */
export function applyShade(hex: string, fraction: number): string {
	const [r, g, b] = parseHexChannels(hex);
	return channelsToHex(r * fraction, g * fraction, b * fraction);
}

/** LumMod: multiply luminance. fraction 0-1. */
export function applyLumMod(hex: string, fraction: number): string {
	const { h, s, l } = hexToHsl(hex);
	return hslToHexString(h, s, Math.min(1, l * fraction));
}

/** LumOff: add to luminance. fraction 0-1. */
export function applyLumOff(hex: string, fraction: number): string {
	const { h, s, l } = hexToHsl(hex);
	return hslToHexString(h, s, Math.min(1, l + fraction));
}

/** SatMod: multiply saturation. fraction 0-1. */
export function applySatMod(hex: string, fraction: number): string {
	const { h, s, l } = hexToHsl(hex);
	return hslToHexString(h, Math.min(1, s * fraction), l);
}

/** SatOff: add to saturation. fraction 0-1. */
export function applySatOff(hex: string, fraction: number): string {
	const { h, s, l } = hexToHsl(hex);
	return hslToHexString(h, Math.min(1, s + fraction), l);
}

/**
 * Apply OpenXML color modifiers (a:tint, a:shade, a:lumMod, etc.) to a base hex color.
 * Iterates child elements of the given Element and applies modifiers in order.
 * val is in 1/1000 percent units (100000 = 100% = 1.0).
 */
export function applyColorModifiers(baseHex: string, colorEl: Element): string {
	let result = baseHex;
	const children = colorEl.children;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const tagName = child.tagName || child.nodeName;
		const valAttr = child.getAttribute('val');
		if (!valAttr) continue;

		const fraction = parseInt(valAttr, 10) / 100000;

		if (tagName === 'a:tint') result = applyTint(result, fraction);
		else if (tagName === 'a:shade') result = applyShade(result, fraction);
		else if (tagName === 'a:lumMod') result = applyLumMod(result, fraction);
		else if (tagName === 'a:lumOff') result = applyLumOff(result, fraction);
		else if (tagName === 'a:satMod') result = applySatMod(result, fraction);
		else if (tagName === 'a:satOff') result = applySatOff(result, fraction);
		// a:alpha — 무시 (pptxgenjs 미지원)
	}

	return result;
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
 * Convert a PlaceholderStyle to an ElementFontStyle, applying defaults.
 */
export function phToElementStyle(
	ph: PlaceholderStyle | undefined,
	defaults: { fontSize: number; fontColor: string; fontWeight: number },
	theme: ThemeData
): ElementFontStyle {
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
 * Returns new elements-array structure with LECTURE_LAYOUT positions.
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

	// callout1 (metadata): subtitle에서 추출, 폴백 allPhs[2]
	const callout1Style = phToElementStyle(
		subtitlePh || allPhs[2],
		{ fontSize: 10, fontColor: '#999999', fontWeight: 400 },
		theme
	);

	// callout2 (speaker): callout1 기반으로 파생. primary=name(bold), secondary=role(derived)
	const callout2Primary: ElementFontStyle = {
		fontFamily: callout1Style.fontFamily,
		fontSize: Math.max(callout1Style.fontSize + 1, 11),
		fontColor: phToElementStyle(
			titlePh || allPhs[0],
			{ fontSize: 14, fontColor: DEFAULT_COLOR, fontWeight: 700 },
			theme
		).fontColor,
		fontWeight: 700
	};

	// title (summary)
	const titleStyle = phToElementStyle(
		titlePh || allPhs[0],
		{ fontSize: 14, fontColor: DEFAULT_COLOR, fontWeight: 700 },
		theme
	);

	// body (context)
	const bodyStyle = phToElementStyle(
		bodyPh || allPhs[1],
		{ fontSize: 12, fontColor: DEFAULT_COLOR, fontWeight: 500 },
		theme
	);

	// caption (detail)
	const captionStyle = phToElementStyle(
		captionPh || allPhs[allPhs.length - 1],
		{ fontSize: 9, fontColor: '#C0C0C0', fontWeight: 400 },
		theme
	);

	const bgColor = styles.background || '#FFFFFF';
	const baseName = fileName.replace(/\.pptx$/i, '');

	return {
		id: `custom-${Date.now()}`,
		name: baseName,
		description: `.pptx에서 추출된 커스텀 템플릿`,
		thumbnail: '',
		background: { color: bgColor },
		elements: [
			{ name: 'callout1', layout: LECTURE_LAYOUT.callout1, styles: [callout1Style] },
			{
				name: 'callout2',
				layout: LECTURE_LAYOUT.callout2,
				styles: [callout2Primary, deriveSecondaryFontStyle(callout2Primary)]
			},
			{ name: 'title', layout: LECTURE_LAYOUT.title, styles: [titleStyle] },
			{ name: 'body', layout: LECTURE_LAYOUT.body, styles: [bodyStyle] },
			{ name: 'image', layout: LECTURE_LAYOUT.image, styles: [] },
			{ name: 'caption', layout: LECTURE_LAYOUT.caption, styles: [captionStyle] }
		]
	};
}
