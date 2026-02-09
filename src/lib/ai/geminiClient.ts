import { GoogleGenAI } from '@google/genai';
import type { ScriptLine, GeminiAnalysisResult } from '$lib/types';
import { buildAnalysisPrompt } from './prompts';

export async function analyzeScript(
  apiKey: string,
  model: string,
  lines: ScriptLine[]
): Promise<GeminiAnalysisResult> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildAnalysisPrompt(lines);

  // For thinking/preview models, limit thinking budget to avoid timeouts
  const isThinkingModel = model.includes('preview') || model.includes('2.5');
  const config: Record<string, unknown> = {
    responseMimeType: 'application/json',
    temperature: 0.7,
  };

  if (isThinkingModel) {
    config.thinkingConfig = { thinkingBudget: 2048 };
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  const text = response.text ?? '';

  // Parse JSON response
  let parsed: GeminiAnalysisResult;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }

  // Validate structure
  if (!parsed.themes || !parsed.slides || !Array.isArray(parsed.slides)) {
    throw new Error('Invalid response structure from Gemini');
  }

  return parsed;
}

/**
 * Fallback analysis when AI is not available.
 * Provides minimal default themes and no visual enhancements.
 */
export function fallbackAnalysis(lines: ScriptLine[]): GeminiAnalysisResult {
  const roles = [...new Set(lines.map((l) => l.role))];
  const speakers = [...new Set(lines.map((l) => l.speaker))];

  // Palette rotation for multiple speakers
  const palettes = [
    { bg: '#EBF5FB', primary: '#1A5276', accent: '#2E86C1' },
    { bg: '#EAFAF1', primary: '#1E8449', accent: '#27AE60' },
    { bg: '#F5EEF8', primary: '#6C3483', accent: '#A569BD' },
    { bg: '#FEF9E7', primary: '#7D6608', accent: '#F1C40F' },
    { bg: '#FDEDEC', primary: '#922B21', accent: '#E74C3C' },
    { bg: '#F4F6F7', primary: '#2C3E50', accent: '#7F8C8D' },
  ];

  // Create themes keyed by speaker name (matching AI output format)
  const themes: GeminiAnalysisResult['themes'] = {};
  speakers.forEach((speaker, i) => {
    const palette = palettes[i % palettes.length];
    themes[speaker] = {
      backgroundColor: palette.bg,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      fontFamily: 'Arial',
      mood: 'professional',
    };
  });

  // Also add themes keyed by role for backward compatibility
  roles.forEach((role, i) => {
    if (!themes[role]) {
      const palette = palettes[i % palettes.length];
      themes[role] = {
        backgroundColor: palette.bg,
        primaryColor: palette.primary,
        accentColor: palette.accent,
        fontFamily: 'Arial',
        mood: 'professional',
      };
    }
  });

  const slides: GeminiAnalysisResult['slides'] = lines.map((line) => ({
    lineNumber: line.lineNumber,
    visual: {
      shapeType: 'none',
      shapeColor: themes[line.speaker]?.accentColor || themes[line.role]?.accentColor || '#636E72',
      position: 'background',
    },
  }));

  return { themes, slides };
}
