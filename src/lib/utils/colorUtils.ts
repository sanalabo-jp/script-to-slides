/**
 * Speaker signature color utilities.
 * Generates vibrant but readable colors for chat UI.
 */

const PRESET_HUES = [210, 340, 160, 30, 270, 190, 10, 130, 300, 50];
let hueIndex = 0;

export function generateSpeakerColor(): string {
  const hue = PRESET_HUES[hueIndex % PRESET_HUES.length];
  hueIndex++;
  const saturation = 65 + Math.floor(Math.random() * 15); // 65-80%
  const lightness = 55 + Math.floor(Math.random() * 10); // 55-65%
  return hslToHex(hue, saturation, lightness);
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
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 128, g: 128, b: 128 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
