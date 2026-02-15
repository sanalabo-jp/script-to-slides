import type { ElementFontStyle, ElementName, SlideTemplate, TemplateElement } from '$lib/types';
import { lightenColor } from '$lib/parser/pptxTemplateUtils';
import { LECTURE_LAYOUT } from './presets';

// === Constants ===

export const FONT_FAMILY_PRESETS: string[] = [
	'Noto Sans',
	'Noto Sans JP',
	'Noto Sans KR',
	'Arial',
	'Helvetica',
	'Roboto',
	'Inter',
	'Montserrat',
	'Source Sans Pro',
	'Pretendard'
];

export const FONT_WEIGHT_OPTIONS: { label: string; value: number }[] = [
	{ label: 'Regular', value: 400 },
	{ label: 'Medium', value: 500 },
	{ label: 'Bold', value: 700 }
];

// === Element Helpers ===

/**
 * Find a TemplateElement by name from an elements array.
 */
export function findElement(
	elements: TemplateElement[],
	name: ElementName
): TemplateElement | undefined {
	return elements.find((e) => e.name === name);
}

/**
 * Get the primary font style of an element (styles[0]).
 * Returns undefined if styles is empty.
 */
export function getPrimaryStyle(element: TemplateElement): ElementFontStyle | undefined {
	return element.styles[0];
}

/**
 * Get the secondary font style of an element (styles[1]).
 * Returns undefined if not present.
 */
export function getSecondaryStyle(element: TemplateElement): ElementFontStyle | undefined {
	return element.styles[1];
}

// === Style Derivation ===

/**
 * Derive a secondary font style from a primary style.
 * Used for callout2 (speaker): name(primary) → role(secondary).
 * - fontColor lightened by 30%
 * - fontWeight lowered to medium (500) if bold, otherwise kept
 */
export function deriveSecondaryFontStyle(primary: ElementFontStyle): ElementFontStyle {
	return {
		fontFamily: primary.fontFamily,
		fontSize: primary.fontSize,
		fontColor: lightenColor(primary.fontColor, 0.3),
		fontWeight: primary.fontWeight >= 700 ? 500 : primary.fontWeight
	};
}

/**
 * @deprecated Use deriveSecondaryFontStyle instead.
 */
export function deriveCallout2(callout1: ElementFontStyle): ElementFontStyle {
	return {
		fontFamily: callout1.fontFamily,
		fontSize: Math.max(callout1.fontSize - 1, 7),
		fontColor: lightenColor(callout1.fontColor, 0.3),
		fontWeight: callout1.fontWeight
	};
}

// === Template Creation ===

/**
 * Create a blank custom template with sensible defaults and Lecture layout.
 */
export function createBlankCustomTemplate(): SlideTemplate {
	const callout2Primary: ElementFontStyle = {
		fontFamily: 'Noto Sans',
		fontSize: 11,
		fontColor: '#434343',
		fontWeight: 700
	};

	return {
		id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		name: 'Custom Template',
		description: 'User-created custom template',
		thumbnail: '',
		background: { color: '#FFFFFF' },
		elements: [
			{
				name: 'callout1',
				layout: LECTURE_LAYOUT.callout1,
				styles: [{ fontFamily: 'Noto Sans', fontSize: 10, fontColor: '#999999', fontWeight: 400 }]
			},
			{
				name: 'callout2',
				layout: LECTURE_LAYOUT.callout2,
				styles: [callout2Primary, deriveSecondaryFontStyle(callout2Primary)]
			},
			{
				name: 'title',
				layout: LECTURE_LAYOUT.title,
				styles: [{ fontFamily: 'Noto Sans', fontSize: 14, fontColor: '#434343', fontWeight: 700 }]
			},
			{
				name: 'body',
				layout: LECTURE_LAYOUT.body,
				styles: [{ fontFamily: 'Noto Sans', fontSize: 12, fontColor: '#434343', fontWeight: 500 }]
			},
			{
				name: 'image',
				layout: LECTURE_LAYOUT.image,
				styles: []
			},
			{
				name: 'caption',
				layout: LECTURE_LAYOUT.caption,
				styles: [{ fontFamily: 'Noto Sans', fontSize: 9, fontColor: '#C0C0C0', fontWeight: 400 }]
			}
		]
	};
}

// === Validation ===

/**
 * Validate a hex color string (#RGB or #RRGGBB).
 */
export function isValidHexColor(hex: string): boolean {
	return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/**
 * Resolve duplicate template name by appending _1, _2, etc.
 */
export function resolveUniqueName(name: string, existingNames: string[]): string {
	if (!existingNames.includes(name)) return name;
	let i = 1;
	while (existingNames.includes(`${name}_${i}`)) {
		i++;
	}
	return `${name}_${i}`;
}
