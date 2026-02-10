import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePptx } from '$lib/generator/slideGenerator';
import type { ParseResult, SlideTemplate } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { parsedScript, template, format } = body as {
    parsedScript: ParseResult;
    template: SlideTemplate;
    format: 'pptx' | 'pdf';
  };

  if (!parsedScript?.slides?.length || !template) {
    throw error(400, 'Missing parsed script or template data');
  }

  try {
    const pptxData = await generatePptx(parsedScript, template);
    const responseBody = pptxData.buffer as ArrayBuffer;

    if (format === 'pdf') {
      // PDF conversion: future implementation
      // For now, return pptx
      return new Response(responseBody, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': 'attachment; filename="presentation.pptx"',
        },
      });
    }

    return new Response(responseBody, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    });
  } catch (err) {
    console.error('PPTX generation failed:', err);
    throw error(
      500,
      `Failed to generate presentation: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
};
