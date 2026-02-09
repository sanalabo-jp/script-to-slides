import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeScript, fallbackAnalysis } from '$lib/ai/geminiClient';
import type { ScriptLine } from '$lib/types';
import { GEMINI_API_KEY, GEMINI_MODEL } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const lines: ScriptLine[] = body.lines;

  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    throw error(400, 'No script lines provided');
  }

  const apiKey = GEMINI_API_KEY;
  const model = GEMINI_MODEL || 'gemini-3-flash-preview';

  // If no API key, use fallback
  if (!apiKey) {
    console.warn('No GEMINI_API_KEY configured, using fallback analysis');
    const result = fallbackAnalysis(lines);
    return json(result);
  }

  try {
    console.log(`[AI] Attempting Gemini analysis with model: ${model}`);
    const result = await analyzeScript(apiKey, model, lines);
    console.log(`[AI] Gemini analysis SUCCESS - themes: ${Object.keys(result.themes).length}, slides: ${result.slides.length}`);
    return json(result);
  } catch (err) {
    console.error(`[AI] Gemini analysis FAILED with model "${model}":`, err);
    console.warn('[AI] Using fallback analysis (no AI features)');
    const result = fallbackAnalysis(lines);
    return json(result);
  }
};
