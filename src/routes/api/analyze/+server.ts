import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeScript, fallbackAnalysis } from '$lib/ai/geminiClient';
import type { ScriptLine } from '$lib/types';
import { GEMINI_API_KEY, GEMINI_MODEL } from '$env/static/private';

// Model fallback chain: try preferred model first, then stable fallback
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const lines: ScriptLine[] = body.lines;

  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    throw error(400, 'No script lines provided');
  }

  const apiKey = GEMINI_API_KEY;
  const primaryModel = GEMINI_MODEL || 'gemini-2.5-flash';

  // If no API key, use fallback
  if (!apiKey) {
    console.warn('No GEMINI_API_KEY configured, using fallback analysis');
    const result = fallbackAnalysis(lines);
    return json(result);
  }

  // Build model chain: primary model + fallbacks (deduplicated)
  const modelChain = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  for (const model of modelChain) {
    try {
      console.log(`[AI] Attempting Gemini analysis with model: ${model}`);
      const result = await analyzeScript(apiKey, model, lines);
      console.log(
        `[AI] Gemini analysis SUCCESS (model: ${model}) - themes: ${Object.keys(result.themes).length}, slides: ${result.slides.length}, supplementary: ${result.slides.filter((s) => s.supplementary).length}`
      );
      return json(result);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[AI] Model "${model}" failed: ${errMsg}`);

      // If this is not the last model in the chain, try the next one
      if (model !== modelChain[modelChain.length - 1]) {
        console.warn(`[AI] Retrying with next model in fallback chain...`);
        continue;
      }

      // All models failed, use static fallback
      console.warn('[AI] All models failed. Using static fallback analysis (no AI features)');
      const result = fallbackAnalysis(lines);
      return json(result);
    }
  }

  // Shouldn't reach here, but just in case
  const result = fallbackAnalysis(lines);
  return json(result);
};
