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
  const model = GEMINI_MODEL || 'gemini-3-flash';

  // If no API key, use fallback
  if (!apiKey) {
    console.warn('No GEMINI_API_KEY configured, using fallback analysis');
    const result = fallbackAnalysis(lines);
    return json(result);
  }

  try {
    const result = await analyzeScript(apiKey, model, lines);
    return json(result);
  } catch (err) {
    console.error('Gemini analysis failed, falling back:', err);
    // Fallback on AI failure
    const result = fallbackAnalysis(lines);
    return json(result);
  }
};
