import PptxGenJS from 'pptxgenjs';
import type { ParseResult, GeminiAnalysisResult, ScriptLine, SlideAnalysis } from '$lib/types';
import { themeToSlideConfig } from './themeEngine';
import { visualToShapeConfig, getBackgroundConfig } from './visualMapper';

export async function generatePptx(
  parsedScript: ParseResult,
  analysis: GeminiAnalysisResult
): Promise<Uint8Array> {
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 16:9
  pptx.author = 'Script-to-Slides';
  pptx.subject = 'Auto-generated presentation from script';

  // ===== Title Slide =====
  addTitleSlide(pptx, parsedScript, analysis);

  // ===== Content Slides (1 line = 1 slide) =====
  for (const line of parsedScript.lines) {
    const slideAnalysis = analysis.slides.find((s) => s.lineNumber === line.lineNumber);
    const theme = analysis.themes[line.role];

    if (!theme) continue;

    addContentSlide(pptx, line, slideAnalysis, theme, analysis);
  }

  // ===== Ending Slide =====
  addEndingSlide(pptx, parsedScript);

  // Generate as arraybuffer
  const output = await pptx.write({ outputType: 'arraybuffer' });
  return new Uint8Array(output as ArrayBuffer);
}

function addTitleSlide(
  pptx: PptxGenJS,
  parsedScript: ParseResult,
  analysis: GeminiAnalysisResult
): void {
  const slide = pptx.addSlide();

  // Use the first role's theme for the title slide
  const firstRole = parsedScript.metadata.roles[0];
  const theme = analysis.themes[firstRole];
  const config = theme ? themeToSlideConfig(theme) : null;

  if (config) {
    slide.background = config.background as PptxGenJS.BackgroundProps;
  } else {
    slide.background = { color: '1A1A2E' };
  }

  // Title
  slide.addText('Script to Slides', {
    x: 0.5,
    y: 1.0,
    w: 9.0,
    h: 1.5,
    fontSize: 36,
    fontFace: config?.titleStyle.fontFace || 'Arial',
    color: config?.titleStyle.color || 'FFFFFF',
    bold: true,
    align: 'center',
  });

  // Metadata
  const speakerList = parsedScript.metadata.speakers
    .map((s, i) => `${s} (${parsedScript.metadata.roles[i] || 'unknown'})`)
    .join('  |  ');

  slide.addText(speakerList, {
    x: 0.5,
    y: 2.8,
    w: 9.0,
    h: 0.8,
    fontSize: 16,
    fontFace: config?.bodyStyle.fontFace || 'Arial',
    color: config?.captionStyle.color || 'AAAAAA',
    align: 'center',
  });

  slide.addText(`${parsedScript.metadata.totalLines} slides`, {
    x: 0.5,
    y: 3.8,
    w: 9.0,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Arial',
    color: config?.captionStyle.color || '888888',
    align: 'center',
    italic: true,
  });
}

function addContentSlide(
  pptx: PptxGenJS,
  line: ScriptLine,
  slideAnalysis: SlideAnalysis | undefined,
  roleTheme: GeminiAnalysisResult['themes'][string],
  _analysis: GeminiAnalysisResult
): void {
  const slide = pptx.addSlide();
  const config = themeToSlideConfig(roleTheme);

  // Background
  if (slideAnalysis?.visual) {
    const bgConfig = getBackgroundConfig(slideAnalysis.visual, roleTheme.backgroundColor);
    slide.background = bgConfig as PptxGenJS.BackgroundProps;
  } else {
    slide.background = config.background as PptxGenJS.BackgroundProps;
  }

  // Visual shape element (from description)
  if (slideAnalysis?.visual) {
    const shapeConfig = visualToShapeConfig(slideAnalysis.visual);
    if (shapeConfig) {
      slide.addShape(shapeConfig.shapeName as PptxGenJS.ShapeType, {
        x: shapeConfig.x,
        y: shapeConfig.y,
        w: shapeConfig.w,
        h: shapeConfig.h,
        fill: shapeConfig.fill,
      });
    }
  }

  // Header: Speaker + Role + Emoji
  const emoji = slideAnalysis?.visual?.emoji || '';
  const headerText = `${emoji} ${line.speaker} · ${line.role}`.trim();

  slide.addText(headerText, {
    x: 0.5,
    y: 0.2,
    w: 9.0,
    h: 0.6,
    fontSize: config.captionStyle.fontSize + 2,
    fontFace: config.titleStyle.fontFace,
    color: config.accentColor,
    bold: true,
  });

  // Description badge (if exists)
  if (line.description) {
    slide.addShape('roundRect' as PptxGenJS.ShapeType, {
      x: 0.5,
      y: 0.85,
      w: 'auto' as unknown as number,
      h: 0.4,
      fill: { color: config.accentColor },
      rectRadius: 0.1,
    });

    slide.addText(`( ${line.description} )`, {
      x: 0.5,
      y: 0.85,
      w: 4.0,
      h: 0.4,
      fontSize: 11,
      fontFace: config.bodyStyle.fontFace,
      color: 'FFFFFF',
      italic: true,
    });
  }

  // Main dialogue content
  const dialogueY = line.description ? 1.5 : 1.2;
  const dialogueH = slideAnalysis?.supplementary ? 2.5 : 3.3;

  slide.addText(line.dialogue, {
    x: 0.8,
    y: dialogueY,
    w: 8.4,
    h: dialogueH,
    fontSize: config.bodyStyle.fontSize,
    fontFace: config.bodyStyle.fontFace,
    color: config.bodyStyle.color,
    align: 'left',
    valign: 'middle',
    wrap: true,
    lineSpacing: 28,
  });

  // Supplementary explanation (AI-generated, optional)
  if (slideAnalysis?.supplementary?.text) {
    // Divider line
    slide.addShape('line' as PptxGenJS.ShapeType, {
      x: 0.5,
      y: 4.2,
      w: 9.0,
      h: 0,
      line: { color: config.accentColor, width: 0.5 },
    });

    const supText = slideAnalysis.supplementary.keywords?.length
      ? `${slideAnalysis.supplementary.text}\n[${slideAnalysis.supplementary.keywords.join(', ')}]`
      : slideAnalysis.supplementary.text;

    slide.addText(supText, {
      x: 0.8,
      y: 4.35,
      w: 8.4,
      h: 1.0,
      fontSize: config.captionStyle.fontSize,
      fontFace: config.captionStyle.fontFace,
      color: config.captionStyle.color,
      italic: config.captionStyle.italic,
      wrap: true,
      valign: 'top',
    });
  }

  // Slide number
  slide.addText(`${line.lineNumber}`, {
    x: 9.0,
    y: 5.1,
    w: 0.8,
    h: 0.4,
    fontSize: 10,
    fontFace: 'Arial',
    color: config.captionStyle.color,
    align: 'right',
  });
}

function addEndingSlide(pptx: PptxGenJS, parsedScript: ParseResult): void {
  const slide = pptx.addSlide();

  slide.background = { color: '1A1A2E' };

  slide.addText('End of Presentation', {
    x: 0.5,
    y: 1.5,
    w: 9.0,
    h: 1.0,
    fontSize: 32,
    fontFace: 'Arial',
    color: 'FFFFFF',
    bold: true,
    align: 'center',
  });

  const credits = parsedScript.metadata.speakers
    .map((s) => `  ${s}`)
    .join('\n');

  slide.addText(`Speakers:\n${credits}`, {
    x: 0.5,
    y: 3.0,
    w: 9.0,
    h: 1.5,
    fontSize: 16,
    fontFace: 'Arial',
    color: 'AAAAAA',
    align: 'center',
    lineSpacing: 24,
  });

  slide.addText(`Total: ${parsedScript.lines.length} slides | Generated by Script-to-Slides`, {
    x: 0.5,
    y: 4.8,
    w: 9.0,
    h: 0.5,
    fontSize: 11,
    fontFace: 'Arial',
    color: '666666',
    align: 'center',
    italic: true,
  });
}
