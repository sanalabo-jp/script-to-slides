import type { SlideTheme } from '$lib/types';

// pptxgenjs-compatible theme configuration
export interface PptxTheme {
  background: { color: string };
  titleStyle: {
    color: string;
    fontFace: string;
    fontSize: number;
    bold: boolean;
  };
  bodyStyle: {
    color: string;
    fontFace: string;
    fontSize: number;
  };
  captionStyle: {
    color: string;
    fontFace: string;
    fontSize: number;
    italic: boolean;
  };
  accentColor: string;
  mood: string;
}

const FONT_SIZE_MAP: Record<string, { title: number; body: number; caption: number }> = {
  professional: { title: 28, body: 20, caption: 14 },
  casual: { title: 32, body: 22, caption: 14 },
  dramatic: { title: 36, body: 24, caption: 16 },
  warm: { title: 30, body: 22, caption: 14 },
  serious: { title: 26, body: 18, caption: 12 },
  playful: { title: 34, body: 24, caption: 16 },
};

/** Safely convert any value to a hex color string (without #) */
function safeColor(value: unknown, fallback = '333333'): string {
  if (typeof value !== 'string') return fallback;
  return value.replace('#', '') || fallback;
}

export function themeToSlideConfig(theme: SlideTheme): PptxTheme {
  const mood = typeof theme.mood === 'string' ? theme.mood : 'professional';
  const sizes = FONT_SIZE_MAP[mood] || FONT_SIZE_MAP.professional;
  const fontFamily = typeof theme.fontFamily === 'string' ? theme.fontFamily : 'Arial';

  return {
    background: { color: safeColor(theme.backgroundColor, 'F8F9FA') },
    titleStyle: {
      color: safeColor(theme.primaryColor, '1A1A2E'),
      fontFace: fontFamily,
      fontSize: sizes.title,
      bold: true,
    },
    bodyStyle: {
      color: safeColor(theme.primaryColor, '2D3436'),
      fontFace: fontFamily,
      fontSize: sizes.body,
    },
    captionStyle: {
      color: safeColor(theme.accentColor, '636E72'),
      fontFace: fontFamily,
      fontSize: sizes.caption,
      italic: true,
    },
    accentColor: safeColor(theme.accentColor, '636E72'),
    mood,
  };
}
