import type { ElementStyle, SlideTemplate } from '$lib/types';
import { lightenColor } from '$lib/parser/pptxTemplateUtils';

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

// === Functions ===

/**
 * Derive callout2 style from callout1 (fontSize -1pt, fontColor lightened).
 */
export function deriveCallout2(callout1: ElementStyle): ElementStyle {
	return {
		fontFamily: callout1.fontFamily,
		fontSize: Math.max(callout1.fontSize - 1, 7),
		fontColor: lightenColor(callout1.fontColor, 0.3),
		fontWeight: callout1.fontWeight
	};
}

/**
 * Create a blank custom template with sensible defaults.
 */
export function createBlankCustomTemplate(): SlideTemplate {
	const callout1Label: ElementStyle = {
		fontFamily: 'Noto Sans',
		fontSize: 11,
		fontColor: '#999999',
		fontWeight: 400
	};

	return {
		id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		name: 'Custom Template',
		description: 'User-created custom template',
		thumbnail: '',
		background: { color: '#FFFFFF' },
		styles: {
			callout1Label,
			callout2Label: deriveCallout2(callout1Label),
			titleLabel: {
				fontFamily: 'Noto Sans',
				fontSize: 14,
				fontColor: '#434343',
				fontWeight: 700
			},
			bodyLabel: {
				fontFamily: 'Noto Sans',
				fontSize: 12,
				fontColor: '#434343',
				fontWeight: 500
			},
			captionLabel: {
				fontFamily: 'Noto Sans',
				fontSize: 9,
				fontColor: '#C0C0C0',
				fontWeight: 400
			}
		}
	};
}

/**
 * Validate a hex color string (#RGB or #RRGGBB).
 */
export function isValidHexColor(hex: string): boolean {
	return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}
