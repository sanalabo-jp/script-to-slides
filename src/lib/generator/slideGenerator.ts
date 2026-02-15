import PptxGenJS from 'pptxgenjs';
import type {
	ParseResult,
	SlideData,
	SlideTemplate,
	ElementFontStyle,
	TemplateElement
} from '$lib/types';
import { findElement } from '$lib/templates/templateUtils';

/** Strip leading '#' from hex color for pptxgenjs */
function stripHash(color: string): string {
	return color.replace(/^#/, '');
}

/** Convert fontWeight to pptxgenjs bold boolean */
function isBold(style: ElementFontStyle): boolean {
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

	const output = await pptx.write({ outputType: 'arraybuffer' });
	return new Uint8Array(output as ArrayBuffer);
}

// === Cover Slide ===

function addCoverSlide(pptx: PptxGenJS, parseResult: ParseResult, template: SlideTemplate): void {
	const slide = pptx.addSlide();
	slide.background = { color: stripHash(template.background.color) } as PptxGenJS.BackgroundProps;

	const titleEl = findElement(template.elements, 'title');
	const callout1El = findElement(template.elements, 'callout1');
	const bodyEl = findElement(template.elements, 'body');
	const captionEl = findElement(template.elements, 'caption');

	// Topic as title (centered, enlarged)
	const topic = parseResult.frontMatter.topic || 'Presentation';
	if (titleEl && titleEl.styles[0]) {
		const s = titleEl.styles[0];
		slide.addText(topic, {
			x: 0.8,
			y: 1.8,
			w: 11.7,
			h: 1.2,
			fontSize: s.fontSize * 2.5,
			fontFace: s.fontFamily,
			color: stripHash(s.fontColor),
			bold: true,
			align: 'center'
		});
	}

	// Categories
	const categories = parseResult.frontMatter.categories;
	if (categories.length > 0 && callout1El && callout1El.styles[0]) {
		const s = callout1El.styles[0];
		slide.addText(categories.join(' · '), {
			x: 0.8,
			y: 3.2,
			w: 11.7,
			h: 0.5,
			fontSize: s.fontSize,
			fontFace: s.fontFamily,
			color: stripHash(s.fontColor),
			align: 'center'
		});
	}

	// Speaker list
	const speakerList = parseResult.metadata.speakers.map((s) => `${s.name} [${s.role}]`).join(', ');
	if (bodyEl && bodyEl.styles[0]) {
		const s = bodyEl.styles[0];
		slide.addText(speakerList, {
			x: 0.8,
			y: 4.2,
			w: 11.7,
			h: 0.6,
			fontSize: s.fontSize,
			fontFace: s.fontFamily,
			color: stripHash(s.fontColor),
			align: 'center'
		});
	}

	// Slide count
	if (captionEl && captionEl.styles[0]) {
		const s = captionEl.styles[0];
		slide.addText(`${parseResult.slides.length} slides`, {
			x: 0.8,
			y: 5.2,
			w: 11.7,
			h: 0.4,
			fontSize: s.fontSize,
			fontFace: s.fontFamily,
			color: stripHash(s.fontColor),
			align: 'center',
			italic: true
		});
	}
}

// === Content Slide ===

function addContentSlide(pptx: PptxGenJS, data: SlideData, template: SlideTemplate): void {
	const slide = pptx.addSlide();
	slide.background = { color: stripHash(template.background.color) } as PptxGenJS.BackgroundProps;

	// Sort elements by zIndex for rendering order
	const sorted = [...template.elements].sort((a, b) => a.layout.zIndex - b.layout.zIndex);

	for (const el of sorted) {
		switch (el.name) {
			case 'callout1':
				renderCallout1(slide, el, data);
				break;
			case 'callout2':
				renderCallout2(slide, el, data);
				break;
			case 'title':
				renderTitle(slide, el, data);
				break;
			case 'body':
				renderBody(slide, el, data);
				break;
			case 'image':
				renderImage(slide, el, data);
				break;
			case 'caption':
				renderCaption(slide, el, data);
				break;
		}
	}
}

// === Element Renderers ===

/** callout1: metadata (key · value, key · value, …) — 1 line, ellipsis */
function renderCallout1(slide: PptxGenJS.Slide, el: TemplateElement, data: SlideData): void {
	const entries = Object.entries(data.metadata);
	if (entries.length === 0) return;

	const style = el.styles[0];
	if (!style) return;

	const text = entries.map(([k, v]) => `${k} · ${v}`).join(', ');
	const { position, size } = el.layout;

	slide.addText(text, {
		x: position.x,
		y: position.y,
		w: size.w,
		h: size.h,
		fontSize: style.fontSize,
		fontFace: style.fontFamily,
		color: stripHash(style.fontColor),
		bold: isBold(style)
	});
}

/** callout2: speaker — dual text run (name: styles[0], role: styles[1]) — 1 line */
function renderCallout2(slide: PptxGenJS.Slide, el: TemplateElement, data: SlideData): void {
	const primaryStyle = el.styles[0];
	if (!primaryStyle) return;

	const secondaryStyle = el.styles[1] || primaryStyle;
	const { position, size } = el.layout;

	const textRuns: PptxGenJS.TextProps[] = [
		{
			text: data.speaker.name,
			options: {
				fontSize: primaryStyle.fontSize,
				fontFace: primaryStyle.fontFamily,
				color: stripHash(primaryStyle.fontColor),
				bold: isBold(primaryStyle)
			}
		},
		{
			text: ` ${data.speaker.role}`,
			options: {
				fontSize: secondaryStyle.fontSize,
				fontFace: secondaryStyle.fontFamily,
				color: stripHash(secondaryStyle.fontColor),
				bold: isBold(secondaryStyle)
			}
		}
	];

	slide.addText(textRuns, {
		x: position.x,
		y: position.y,
		w: size.w,
		h: size.h
	});
}

/** title: summary — 1 line, nullable */
function renderTitle(slide: PptxGenJS.Slide, el: TemplateElement, data: SlideData): void {
	if (!data.summary) return;

	const style = el.styles[0];
	if (!style) return;

	const { position, size } = el.layout;

	slide.addText(data.summary, {
		x: position.x,
		y: position.y,
		w: size.w,
		h: size.h,
		fontSize: style.fontSize,
		fontFace: style.fontFamily,
		color: stripHash(style.fontColor),
		bold: isBold(style)
	});
}

/** body: context (dialogue) */
function renderBody(slide: PptxGenJS.Slide, el: TemplateElement, data: SlideData): void {
	const style = el.styles[0];
	if (!style) return;

	const { position, size } = el.layout;

	slide.addText(data.context, {
		x: position.x,
		y: position.y,
		w: size.w,
		h: size.h,
		fontSize: style.fontSize,
		fontFace: style.fontFamily,
		color: stripHash(style.fontColor),
		bold: isBold(style),
		align: 'left',
		valign: 'top',
		wrap: true,
		lineSpacing: 28
	});
}

/** image: 4:3 image — nullable (placeholder for future feature 3) */
function renderImage(_slide: PptxGenJS.Slide, _el: TemplateElement, _data: SlideData): void {
	// Image rendering will be implemented in Feature 3 (image search/indexing)
	// For now, skip rendering when data.image is null
	if (!_data.image) return;

	// Future: slide.addImage({ path: data.image, x, y, w, h })
}

/** caption: detail — nullable, left align */
function renderCaption(slide: PptxGenJS.Slide, el: TemplateElement, data: SlideData): void {
	if (!data.detail) return;

	const style = el.styles[0];
	if (!style) return;

	const { position, size } = el.layout;

	slide.addText(data.detail, {
		x: position.x,
		y: position.y,
		w: size.w,
		h: size.h,
		fontSize: style.fontSize,
		fontFace: style.fontFamily,
		color: stripHash(style.fontColor),
		align: 'left'
	});
}
