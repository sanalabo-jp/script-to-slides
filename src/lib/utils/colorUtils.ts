/**
 * Speaker signature color utilities.
 * Generates muted, modern colors for chat UI.
 * Palette: gray/charcoal (primary), navy/purple/brown (accent).
 */

interface ColorPreset {
	h: number;
	s: number;
	l: number;
}

const PRESET_COLORS: ColorPreset[] = [
	// Gray/charcoal family (primary)
	{ h: 220, s: 10, l: 33 }, // Cool charcoal
	{ h: 0, s: 0, l: 42 }, // Neutral gray
	{ h: 210, s: 8, l: 50 }, // Cool medium gray
	// Navy family
	{ h: 215, s: 45, l: 28 }, // Deep navy
	{ h: 225, s: 35, l: 36 }, // Steel navy
	// Purple family
	{ h: 270, s: 25, l: 38 }, // Muted purple
	{ h: 260, s: 20, l: 45 }, // Soft violet
	// Brown family
	{ h: 25, s: 35, l: 35 }, // Dark brown
	{ h: 20, s: 25, l: 44 }, // Warm taupe
	// Dark indigo
	{ h: 245, s: 28, l: 34 } // Deep indigo
];

let colorIndex = 0;

export function generateSpeakerColor(): string {
	const preset = PRESET_COLORS[colorIndex % PRESET_COLORS.length];
	colorIndex++;
	const sVar = Math.floor(Math.random() * 6) - 3;
	const lVar = Math.floor(Math.random() * 6) - 3;
	return hslToHex(
		preset.h,
		Math.max(0, Math.min(100, preset.s + sVar)),
		Math.max(15, Math.min(65, preset.l + lVar))
	);
}

export function lightenColor(hex: string, percent: number): string {
	const { r, g, b } = hexToRgb(hex);
	return rgbToHex(
		Math.min(255, Math.round(r + (255 - r) * (percent / 100))),
		Math.min(255, Math.round(g + (255 - g) * (percent / 100))),
		Math.min(255, Math.round(b + (255 - b) * (percent / 100)))
	);
}

function hslToHex(h: number, s: number, l: number): string {
	const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l / 100 - c / 2;
	let r: number, g: number, b: number;

	if (h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		g = 0;
		b = c;
	} else {
		r = c;
		g = 0;
		b = x;
	}

	return rgbToHex(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			}
		: { r: 128, g: 128, b: 128 };
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
