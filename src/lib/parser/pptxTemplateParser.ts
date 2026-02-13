import JSZip from 'jszip';
import type { SlideTemplate } from '$lib/types';
import {
	type ThemeData,
	type PlaceholderStyle,
	type ExtractedStyles,
	type PptxParseResult,
	SCHEME_CLR_MAP,
	DEFAULT_FONT,
	resolveFont,
	mergeStyles,
	buildTemplate
} from './pptxTemplateUtils';

// === Public API ===

export async function parsePptxTemplate(file: File): Promise<PptxParseResult> {
	const arrayBuffer = await file.arrayBuffer();
	const zip = await JSZip.loadAsync(arrayBuffer); // JSZip failure → throw

	const warnings: string[] = [];
	let isPartial = false;

	// Theme: graceful — missing theme uses defaults
	let theme: ThemeData;
	try {
		theme = await parseTheme(zip);
		if (Object.keys(theme.colorScheme).length === 0) {
			warnings.push('Theme color scheme not found, using defaults');
			isPartial = true;
		}
	} catch {
		theme = { colorScheme: {}, majorFont: DEFAULT_FONT, minorFont: DEFAULT_FONT };
		warnings.push('Failed to parse theme, using defaults');
		isPartial = true;
	}

	// Master: graceful
	let masterStyles: ExtractedStyles;
	try {
		masterStyles = await parseSlideMaster(zip, theme);
	} catch {
		masterStyles = { background: null, placeholders: [] };
		warnings.push('Failed to parse slide master');
		isPartial = true;
	}

	// Layouts: graceful — individual layout failures are skipped
	let layoutStyles: ExtractedStyles;
	try {
		layoutStyles = await parseSlideLayouts(zip, theme);
	} catch {
		layoutStyles = { background: null, placeholders: [] };
		warnings.push('Failed to parse slide layouts');
		isPartial = true;
	}

	const merged = mergeStyles(masterStyles, layoutStyles);
	const template = buildTemplate(file.name, merged, theme);

	return { template, warnings, isPartial };
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

// === XML Utilities ===

async function readXml(zip: JSZip, path: string): Promise<Document | null> {
	const entry = zip.file(path);
	if (!entry) return null;

	const text = await entry.async('text');
	const parser = new DOMParser();
	return parser.parseFromString(text, 'application/xml');
}
