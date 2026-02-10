import PptxGenJS from 'pptxgenjs';
import type { ParseResult, SlideData, SlideTemplate, ElementStyle } from '$lib/types';

/** Strip leading '#' from hex color for pptxgenjs */
function stripHash(color: string): string {
  return color.replace(/^#/, '');
}

/** Convert ElementStyle fontWeight to pptxgenjs bold boolean */
function isBold(style: ElementStyle): boolean {
  return style.fontWeight >= 700;
}

export async function generatePptx(
  parseResult: ParseResult,
  template: SlideTemplate
): Promise<Uint8Array> {
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"
  pptx.author = 'Script-to-Slides';
  pptx.subject = parseResult.frontMatter.topic || 'Auto-generated presentation';

  // ===== Cover Slide =====
  addCoverSlide(pptx, parseResult, template);

  // ===== Content Slides (1 slide per dialogue line) =====
  for (const slide of parseResult.slides) {
    addContentSlide(pptx, slide, template);
  }

  // ===== Ending Slide =====
  addEndingSlide(pptx, parseResult, template);

  const output = await pptx.write({ outputType: 'arraybuffer' });
  return new Uint8Array(output as ArrayBuffer);
}

function addCoverSlide(
  pptx: PptxGenJS,
  parseResult: ParseResult,
  template: SlideTemplate
): void {
  const slide = pptx.addSlide();
  const bg = stripHash(template.background.color);
  slide.background = { color: bg } as PptxGenJS.BackgroundProps;

  const { styles } = template;

  // Topic as title
  const topic = parseResult.frontMatter.topic || 'Presentation';
  slide.addText(topic, {
    x: 0.8,
    y: 1.8,
    w: 11.7,
    h: 1.2,
    fontSize: styles.titleLabel.fontSize * 2.5,
    fontFace: styles.titleLabel.fontFamily,
    color: stripHash(styles.titleLabel.fontColor),
    bold: true,
    align: 'center',
  });

  // Categories
  const categories = parseResult.frontMatter.categories;
  if (categories.length > 0) {
    slide.addText(categories.join(' · '), {
      x: 0.8,
      y: 3.2,
      w: 11.7,
      h: 0.5,
      fontSize: styles.callout1Label.fontSize,
      fontFace: styles.callout1Label.fontFamily,
      color: stripHash(styles.callout1Label.fontColor),
      align: 'center',
    });
  }

  // Speaker list
  const speakerList = parseResult.metadata.speakers
    .map((s) => `${s.name} [${s.role}]`)
    .join(', ');

  slide.addText(speakerList, {
    x: 0.8,
    y: 4.2,
    w: 11.7,
    h: 0.6,
    fontSize: styles.bodyLabel.fontSize,
    fontFace: styles.bodyLabel.fontFamily,
    color: stripHash(styles.callout2Label.fontColor),
    align: 'center',
  });

  // Slide count
  slide.addText(`${parseResult.slides.length} slides`, {
    x: 0.8,
    y: 5.2,
    w: 11.7,
    h: 0.4,
    fontSize: styles.captionLabel.fontSize,
    fontFace: styles.captionLabel.fontFamily,
    color: stripHash(styles.captionLabel.fontColor),
    align: 'center',
    italic: true,
  });
}

function addContentSlide(
  pptx: PptxGenJS,
  data: SlideData,
  template: SlideTemplate
): void {
  const slide = pptx.addSlide();
  const bg = stripHash(template.background.color);
  slide.background = { color: bg } as PptxGenJS.BackgroundProps;

  const { styles } = template;

  // --- callout1Label: speaker info ---
  const speakerText = `${data.speaker.name} [${data.speaker.role}]`;
  slide.addText(speakerText, {
    x: 0.8,
    y: 0.4,
    w: 11.7,
    h: 0.4,
    fontSize: styles.callout1Label.fontSize,
    fontFace: styles.callout1Label.fontFamily,
    color: stripHash(styles.callout1Label.fontColor),
    bold: isBold(styles.callout1Label),
  });

  // --- callout2Label: metadata (· separated) ---
  const metadataEntries = Object.entries(data.metadata);
  let nextY = 0.85;

  if (metadataEntries.length > 0) {
    const metadataText = metadataEntries.map(([k, v]) => `${k}: ${v}`).join(' · ');
    slide.addText(metadataText, {
      x: 0.8,
      y: nextY,
      w: 11.7,
      h: 0.35,
      fontSize: styles.callout2Label.fontSize,
      fontFace: styles.callout2Label.fontFamily,
      color: stripHash(styles.callout2Label.fontColor),
      bold: isBold(styles.callout2Label),
    });
    nextY += 0.45;
  }

  // --- titleLabel: visual hint (if present) ---
  if (data.visualHint) {
    slide.addText(`( ${data.visualHint} )`, {
      x: 0.8,
      y: nextY,
      w: 11.7,
      h: 0.5,
      fontSize: styles.titleLabel.fontSize,
      fontFace: styles.titleLabel.fontFamily,
      color: stripHash(styles.titleLabel.fontColor),
      bold: isBold(styles.titleLabel),
      italic: true,
    });
    nextY += 0.6;
  }

  // --- bodyLabel: context (dialogue) ---
  const bodyTop = Math.max(nextY + 0.2, 1.6);
  const bodyHeight = 6.8 - bodyTop - 0.8; // leave room for caption

  slide.addText(data.context, {
    x: 0.8,
    y: bodyTop,
    w: 11.7,
    h: bodyHeight,
    fontSize: styles.bodyLabel.fontSize,
    fontFace: styles.bodyLabel.fontFamily,
    color: stripHash(styles.bodyLabel.fontColor),
    bold: isBold(styles.bodyLabel),
    align: 'left',
    valign: 'top',
    wrap: true,
    lineSpacing: 28,
  });

  // --- captionLabel: slide number ---
  slide.addText(`${data.lineNumber}`, {
    x: 0.8,
    y: 6.8,
    w: 11.7,
    h: 0.4,
    fontSize: styles.captionLabel.fontSize,
    fontFace: styles.captionLabel.fontFamily,
    color: stripHash(styles.captionLabel.fontColor),
    align: 'right',
  });
}

function addEndingSlide(
  pptx: PptxGenJS,
  parseResult: ParseResult,
  template: SlideTemplate
): void {
  const slide = pptx.addSlide();
  const bg = stripHash(template.background.color);
  slide.background = { color: bg } as PptxGenJS.BackgroundProps;

  const { styles } = template;

  slide.addText('End of Presentation', {
    x: 0.8,
    y: 2.0,
    w: 11.7,
    h: 1.0,
    fontSize: styles.titleLabel.fontSize * 2,
    fontFace: styles.titleLabel.fontFamily,
    color: stripHash(styles.titleLabel.fontColor),
    bold: true,
    align: 'center',
  });

  const credits = parseResult.metadata.speakers
    .map((s) => `${s.name} [${s.role}]`)
    .join('\n');

  slide.addText(`Speakers:\n${credits}`, {
    x: 0.8,
    y: 3.5,
    w: 11.7,
    h: 1.5,
    fontSize: styles.bodyLabel.fontSize,
    fontFace: styles.bodyLabel.fontFamily,
    color: stripHash(styles.callout1Label.fontColor),
    align: 'center',
    lineSpacing: 24,
  });

  slide.addText(
    `Total: ${parseResult.slides.length} slides | Generated by Script-to-Slides`,
    {
      x: 0.8,
      y: 5.5,
      w: 11.7,
      h: 0.4,
      fontSize: styles.captionLabel.fontSize,
      fontFace: styles.captionLabel.fontFamily,
      color: stripHash(styles.captionLabel.fontColor),
      align: 'center',
      italic: true,
    }
  );
}
