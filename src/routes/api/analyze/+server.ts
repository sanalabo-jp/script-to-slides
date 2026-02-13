import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * AI analysis endpoint — disabled in Phase 1 (template system).
 * Will be re-enabled when AI-based template recommendation is implemented (Phase 4).
 */
export const POST: RequestHandler = async () => {
  return json(
    {
      error: 'AI analysis is currently disabled. Template selection is handled client-side.',
      status: 'disabled',
    },
    { status: 501 }
  );
};
