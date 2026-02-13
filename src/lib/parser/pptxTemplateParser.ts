import JSZip from 'jszip';
import type { SlideTemplate, ElementStyle } from '$lib/types';

// === OpenXML Constants ===

/** schemeClr name → theme1.xml element tag */
const SCHEME_CLR_MAP: Record<string, string> = {
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

const DEFAULT_FONT = 'Noto Sans';
const DEFAULT_COLOR = '#434343';

// === Types ===

interface ThemeData {
	colorScheme: Record<string, string>;
	majorFont: string;
	minorFont: string;
}

interface PlaceholderStyle {
	type: string;
	fontFamily?: string;
	fontSize?: number;
	fontColor?: string;
	bold?: boolean;
}

interface ExtractedStyles {
	background: string | null;
	placeholders: PlaceholderStyle[];
}

// === Public API ===

export async function parsePptxTemplate(file: File): Promise<SlideTemplate> {
	const arrayBuffer = await file.arrayBuffer();
	const zip = await JSZip.loadAsync(arrayBuffer);

	const theme = await parseTheme(zip);
	const masterStyles = await parseSlideMaster(zip, theme);
	const layoutStyles = await parseSlideLayouts(zip, theme);

	const merged = mergeStyles(masterStyles, layoutStyles);
	const template = buildTemplate(file.name, merged, theme);

	return template;
}

// === Theme Parsing ===

async function parseTheme(zip: JSZip): Promise<ThemeData> {
	const themeXml = await readXml(zip, 'ppt/theme/theme1.xml');
	if (!themeXml) {
		return { colorScheme: {}, majorFont: DEFAULT_FONT, minorFont: DEFAULT_FONT };
	}

	const colorScheme: Record<string, string> = {};
	const clrSchemeEl = themeXml.getElementsByTagName('a:clrScheme')[0];
	if (clrSchemeEl) {
		for (const [name, tag] of Object.entries(SCHEME_CLR_MAP)) {
			const el = clrSchemeEl.getElementsByTagName(tag)[0];
			if (el) {
				const color = extractColorFromElement(el);
				if (color) colorScheme[name] = color;
			}
		}
	}

	const majorFont = extractThemeFont(themeXml, 'a:majorFont') || DEFAULT_FONT;
	const minorFont = extractThemeFont(themeXml, 'a:minorFont') || DEFAULT_FONT;

	return { colorScheme, majorFont, minorFont };
}

function extractThemeFont(doc: Document, tagName: string): string | null {
	const fontEl = doc.getElementsByTagName(tagName)[0];
	if (!fontEl) return null;

	const latinEl = fontEl.getElementsByTagName('a:latin')[0];
	if (latinEl) {
		const typeface = latinEl.getAttribute('typeface');
		if (typeface && !typeface.startsWith('+')) return typeface;
	}

	const eaEl = fontEl.getElementsByTagName('a:ea')[0];
	if (eaEl) {
		const typeface = eaEl.getAttribute('typeface');
		if (typeface && typeface.length > 0 && !typeface.startsWith('+')) return typeface;
	}

	return null;
}

// === Slide Master Parsing ===

async function parseSlideMaster(zip: JSZip, theme: ThemeData): Promise<ExtractedStyles> {
	const masterXml = await readXml(zip, 'ppt/slideMasters/slideMaster1.xml');
	if (!masterXml) return { background: null, placeholders: [] };

	const background = extractBackground(masterXml, theme);
	const placeholders = extractPlaceholders(masterXml, theme);

	return { background, placeholders };
}

// === Slide Layout Parsing ===

async function parseSlideLayouts(zip: JSZip, theme: ThemeData): Promise<ExtractedStyles> {
	const allPlaceholders: PlaceholderStyle[] = [];
	let background: string | null = null;

	for (let i = 1; i <= 11; i++) {
		const path = `ppt/slideLayouts/slideLayout${i}.xml`;
		const layoutXml = await readXml(zip, path);
		if (!layoutXml) continue;

		if (!background) {
			background = extractBackground(layoutXml, theme);
		}

		const placeholders = extractPlaceholders(layoutXml, theme);
		allPlaceholders.push(...placeholders);
	}

	return { background, placeholders: allPlaceholders };
}

// === Placeholder Extraction ===

function extractPlaceholders(doc: Document, theme: ThemeData): PlaceholderStyle[] {
	const result: PlaceholderStyle[] = [];
	const shapes = doc.getElementsByTagName('p:sp');

	for (let i = 0; i < shapes.length; i++) {
		const sp = shapes[i];
		const phEl = sp.getElementsByTagName('p:ph')[0];
		if (!phEl) continue;

		const phType = phEl.getAttribute('type') || 'body';
		const style = extractTextStyle(sp, theme);

		result.push({ type: phType, ...style });
	}

	return result;
}

function extractTextStyle(sp: Element, theme: ThemeData): Omit<PlaceholderStyle, 'type'> {
	const result: Omit<PlaceholderStyle, 'type'> = {};

	// lstStyle > lvl1pPr > defRPr 에서 추출
	const defRPr = findDefRPr(sp, 'a:lstStyle') || findDefRPr(sp, 'a:bodyPr');

	// 직접 rPr 탐색 (lstStyle에 없을 경우)
	const rPr =
		defRPr || sp.getElementsByTagName('a:endParaRPr')[0] || sp.getElementsByTagName('a:rPr')[0];

	if (!rPr && !defRPr) return result;

	const styleEl = rPr || defRPr;
	if (!styleEl) return result;

	// fontSize: sz 속성 (1/100 pt)
	const sz = styleEl.getAttribute('sz');
	if (sz) result.fontSize = parseInt(sz, 10) / 100;

	// bold
	const b = styleEl.getAttribute('b');
	if (b === '1' || b === 'true') result.bold = true;

	// fontColor
	const color = extractTextColor(styleEl, theme);
	if (color) result.fontColor = color;

	// fontFamily
	const font = extractFontFamily(styleEl, theme);
	if (font) result.fontFamily = font;

	return result;
}

function findDefRPr(sp: Element, containerTag: string): Element | null {
	const container = sp.getElementsByTagName(containerTag)[0];
	if (!container) return null;

	// lvl1pPr > defRPr 우선
	const lvl1 = container.getElementsByTagName('a:lvl1pPr')[0];
	if (lvl1) {
		const defRPr = lvl1.getElementsByTagName('a:defRPr')[0];
		if (defRPr) return defRPr;
	}

	// pPr > defRPr 폴백
	const pPr = container.getElementsByTagName('a:pPr')[0];
	if (pPr) {
		const defRPr = pPr.getElementsByTagName('a:defRPr')[0];
		if (defRPr) return defRPr;
	}

	return null;
}

// === Color Extraction ===

function extractTextColor(el: Element, theme: ThemeData): string | null {
	const solidFill = el.getElementsByTagName('a:solidFill')[0];
	if (!solidFill) return null;

	return resolveColor(solidFill, theme);
}

function extractBackground(doc: Document, theme: ThemeData): string | null {
	const bgPr = doc.getElementsByTagName('p:bgPr')[0];
	if (bgPr) {
		const solidFill = bgPr.getElementsByTagName('a:solidFill')[0];
		if (solidFill) return resolveColor(solidFill, theme);
	}

	const bgRef = doc.getElementsByTagName('p:bgRef')[0];
	if (bgRef) {
		const color = resolveColor(bgRef, theme);
		if (color) return color;
	}

	return null;
}

function resolveColor(el: Element, theme: ThemeData): string | null {
	// srgbClr: 직접 hex
	const srgbClr = el.getElementsByTagName('a:srgbClr')[0];
	if (srgbClr) {
		const val = srgbClr.getAttribute('val');
		if (val) return `#${val}`;
	}

	// schemeClr: 테마 참조
	const schemeClr = el.getElementsByTagName('a:schemeClr')[0];
	if (schemeClr) {
		const val = schemeClr.getAttribute('val');
		if (val && theme.colorScheme[val]) {
			return theme.colorScheme[val];
		}
		// tx1 → dk1, tx2 → dk2, bg1 → lt1, bg2 → lt2 매핑
		const alias: Record<string, string> = {
			tx1: 'dk1',
			tx2: 'dk2',
			bg1: 'lt1',
			bg2: 'lt2'
		};
		if (val && alias[val] && theme.colorScheme[alias[val]]) {
			return theme.colorScheme[alias[val]];
		}
	}

	return null;
}

function extractColorFromElement(el: Element): string | null {
	const srgbClr = el.getElementsByTagName('a:srgbClr')[0];
	if (srgbClr) {
		const val = srgbClr.getAttribute('val');
		if (val) return `#${val}`;
	}

	const sysClr = el.getElementsByTagName('a:sysClr')[0];
	if (sysClr) {
		const lastClr = sysClr.getAttribute('lastClr');
		if (lastClr) return `#${lastClr}`;
	}

	return null;
}

// === Font Extraction ===

function extractFontFamily(el: Element, theme: ThemeData): string | null {
	const latin = el.getElementsByTagName('a:latin')[0];
	if (latin) {
		const typeface = latin.getAttribute('typeface');
		if (typeface) return resolveFont(typeface, theme);
	}

	const ea = el.getElementsByTagName('a:ea')[0];
	if (ea) {
		const typeface = ea.getAttribute('typeface');
		if (typeface && typeface.length > 0) return resolveFont(typeface, theme);
	}

	return null;
}

function resolveFont(typeface: string, theme: ThemeData): string {
	if (typeface === '+mj-lt' || typeface === '+mj-ea') return theme.majorFont;
	if (typeface === '+mn-lt' || typeface === '+mn-ea') return theme.minorFont;
	return typeface;
}

// === Style Merging ===

function mergeStyles(master: ExtractedStyles, layouts: ExtractedStyles): ExtractedStyles {
	const background = master.background || layouts.background;

	// master placeholders를 기본으로, layout이 오버라이드
	const phMap = new Map<string, PlaceholderStyle>();

	for (const ph of master.placeholders) {
		phMap.set(ph.type, ph);
	}

	for (const ph of layouts.placeholders) {
		const existing = phMap.get(ph.type);
		if (existing) {
			// layout이 가진 속성만 오버라이드
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

// === Template Building ===

function buildTemplate(fileName: string, styles: ExtractedStyles, theme: ThemeData): SlideTemplate {
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

function phToElementStyle(
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

// === Color Utilities ===

function lightenColor(hex: string, amount: number): string {
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

// === XML Utilities ===

async function readXml(zip: JSZip, path: string): Promise<Document | null> {
	const entry = zip.file(path);
	if (!entry) return null;

	const text = await entry.async('text');
	const parser = new DOMParser();
	return parser.parseFromString(text, 'application/xml');
}
