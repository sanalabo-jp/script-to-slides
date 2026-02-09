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

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
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

  const defaultPalettes: Record<string, { bg: string; primary: string; accent: string }> = {
    teacher: { bg: '#EBF5FB', primary: '#1A5276', accent: '#2E86C1' },
    student: { bg: '#EAFAF1', primary: '#1E8449', accent: '#27AE60' },
    anchor: { bg: '#F4F6F7', primary: '#2C3E50', accent: '#7F8C8D' },
    host: { bg: '#FEF9E7', primary: '#7D6608', accent: '#F1C40F' },
    narrator: { bg: '#F5EEF8', primary: '#6C3483', accent: '#A569BD' },
  };

  const fallbackPalette = { bg: '#F8F9FA', primary: '#2D3436', accent: '#636E72' };

  const themes: GeminiAnalysisResult['themes'] = {};
  for (const role of roles) {
    const palette = defaultPalettes[role.toLowerCase()] || fallbackPalette;
    themes[role] = {
      backgroundColor: palette.bg,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      fontFamily: 'Arial',
      mood: 'professional',
    };
  }

  const slides: GeminiAnalysisResult['slides'] = lines.map((line) => ({
    lineNumber: line.lineNumber,
    visual: {
      shapeType: 'none',
      shapeColor: themes[line.role]?.accentColor || fallbackPalette.accent,
      position: 'background',
    },
  }));

  return { themes, slides };
}
