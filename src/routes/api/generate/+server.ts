import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePptx } from '$lib/generator/slideGenerator';
import type { ParseResult, GeminiAnalysisResult } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { parsedScript, analysis, format } = body as {
    parsedScript: ParseResult;
    analysis: GeminiAnalysisResult;
    format: 'pptx' | 'pdf';
  };

  if (!parsedScript?.lines?.length || !analysis) {
    throw error(400, 'Missing parsed script or analysis data');
  }

  try {
    const pptxData = await generatePptx(parsedScript, analysis);

    if (format === 'pdf') {
      // PDF conversion: future implementation
      // For now, return pptx with a note
      return new Response(pptxData, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': 'attachment; filename="presentation.pptx"',
        },
      });
    }

    return new Response(pptxData, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    });
  } catch (err) {
    console.error('PPTX generation failed:', err);
    throw error(500, `Failed to generate presentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};
