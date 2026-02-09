import type { SlideTheme } from '$lib/types';

// pptxgenjs-compatible theme configuration
export interface PptxTheme {
  background: { color: string } | { fill: { type: string; color1: string; color2: string; angle: number } };
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

export function themeToSlideConfig(theme: SlideTheme): PptxTheme {
  const sizes = FONT_SIZE_MAP[theme.mood] || FONT_SIZE_MAP.professional;

  return {
    background: { color: theme.backgroundColor.replace('#', '') },
    titleStyle: {
      color: theme.primaryColor.replace('#', ''),
      fontFace: theme.fontFamily || 'Arial',
      fontSize: sizes.title,
      bold: true,
    },
    bodyStyle: {
      color: theme.primaryColor.replace('#', ''),
      fontFace: theme.fontFamily || 'Arial',
      fontSize: sizes.body,
    },
    captionStyle: {
      color: theme.accentColor.replace('#', ''),
      fontFace: theme.fontFamily || 'Arial',
      fontSize: sizes.caption,
      italic: true,
    },
    accentColor: theme.accentColor.replace('#', ''),
    mood: theme.mood,
  };
}
