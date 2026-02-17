import type {
	SlideTemplate,
	TemplateElement,
	ElementLayout,
	ElementFontStyle,
	ElementName
} from '$lib/types';

const NOTO_SANS = 'Noto Sans';

// === Default Lecture Layout (LAYOUT_WIDE: 13.33" × 7.5") ===

const LECTURE_LAYOUT: Record<ElementName, ElementLayout> = {
	callout1: { position: { x: 0.8, y: 0.3 }, size: { w: 11.7, h: 0.35 }, zIndex: 2 },
	callout2: { position: { x: 0.8, y: 0.7 }, size: { w: 11.7, h: 0.35 }, zIndex: 3 },
	title: { position: { x: 0.8, y: 1.3 }, size: { w: 11.7, h: 0.5 }, zIndex: 6 },
	body: { position: { x: 0.8, y: 2.1 }, size: { w: 7.0, h: 4.5 }, zIndex: 5 },
	image: { position: { x: 8.2, y: 2.1 }, size: { w: 4.33, h: 3.25 }, zIndex: 4 },
	caption: { position: { x: 0.8, y: 6.8 }, size: { w: 11.7, h: 0.4 }, zIndex: 1 }
};

function createElement(
	name: ElementName,
	layout: ElementLayout,
	...styles: ElementFontStyle[]
): TemplateElement {
	return { name, layout, styles };
}

// === Preset Templates ===

export const blankTemplate: SlideTemplate = {
	id: 'blank',
	name: 'Blank',
	description: '깔끔한 흰 배경의 기본 템플릿',
	thumbnail: '/thumbnails/blank.svg',
	background: { color: '#FFFFFF' },
	elements: [
		createElement('callout1', LECTURE_LAYOUT.callout1, {
			fontFamily: NOTO_SANS,
			fontSize: 10,
			fontColor: '#999999',
			fontWeight: 400
		}),
		createElement(
			'callout2',
			LECTURE_LAYOUT.callout2,
			{ fontFamily: NOTO_SANS, fontSize: 11, fontColor: '#434343', fontWeight: 700 },
			{ fontFamily: NOTO_SANS, fontSize: 11, fontColor: '#999999', fontWeight: 500 }
		),
		createElement('title', LECTURE_LAYOUT.title, {
			fontFamily: NOTO_SANS,
			fontSize: 14,
			fontColor: '#434343',
			fontWeight: 700
		}),
		createElement('body', LECTURE_LAYOUT.body, {
			fontFamily: NOTO_SANS,
			fontSize: 12,
			fontColor: '#434343',
			fontWeight: 500
		}),
		createElement('image', LECTURE_LAYOUT.image),
		createElement('caption', LECTURE_LAYOUT.caption, {
			fontFamily: NOTO_SANS,
			fontSize: 9,
			fontColor: '#C0C0C0',
			fontWeight: 400
		})
	]
};

export const modernDarkTemplate: SlideTemplate = {
	id: 'modern-dark',
	name: 'Modern Dark',
	description: '어두운 배경의 모던한 템플릿',
	thumbnail: '/thumbnails/modern-dark.svg',
	background: { color: '#1A1A2E' },
	elements: [
		createElement('callout1', LECTURE_LAYOUT.callout1, {
			fontFamily: NOTO_SANS,
			fontSize: 10,
			fontColor: '#666688',
			fontWeight: 400
		}),
		createElement(
			'callout2',
			LECTURE_LAYOUT.callout2,
			{ fontFamily: NOTO_SANS, fontSize: 11, fontColor: '#E0E0E0', fontWeight: 700 },
			{ fontFamily: NOTO_SANS, fontSize: 11, fontColor: '#8888AA', fontWeight: 500 }
		),
		createElement('title', LECTURE_LAYOUT.title, {
			fontFamily: NOTO_SANS,
			fontSize: 14,
			fontColor: '#E0E0E0',
			fontWeight: 700
		}),
		createElement('body', LECTURE_LAYOUT.body, {
			fontFamily: NOTO_SANS,
			fontSize: 12,
			fontColor: '#CCCCCC',
			fontWeight: 500
		}),
		createElement('image', LECTURE_LAYOUT.image),
		createElement('caption', LECTURE_LAYOUT.caption, {
			fontFamily: NOTO_SANS,
			fontSize: 9,
			fontColor: '#555577',
			fontWeight: 400
		})
	]
};

export const softBlueTemplate: SlideTemplate = {
	id: 'soft-blue',
	name: 'Soft Blue',
	description: '부드러운 블루 톤의 전문적인 템플릿',
	thumbnail: '/thumbnails/soft-blue.svg',
	background: { color: '#F0F4FA' },
	elements: [
		createElement('callout1', LECTURE_LAYOUT.callout1, {
			fontFamily: NOTO_SANS,
			fontSize: 10,
			fontColor: '#9AABC8',
			fontWeight: 400
		}),
		createElement(
			'callout2',
			LECTURE_LAYOUT.callout2,
			{ fontFamily: NOTO_SANS, fontSize: 11, fontColor: '#26489D', fontWeight: 700 },
			{ fontFamily: NOTO_SANS, fontSize: 11, fontColor: '#7A8BAE', fontWeight: 500 }
		),
		createElement('title', LECTURE_LAYOUT.title, {
			fontFamily: NOTO_SANS,
			fontSize: 14,
			fontColor: '#26489D',
			fontWeight: 700
		}),
		createElement('body', LECTURE_LAYOUT.body, {
			fontFamily: NOTO_SANS,
			fontSize: 12,
			fontColor: '#2D3748',
			fontWeight: 500
		}),
		createElement('image', LECTURE_LAYOUT.image),
		createElement('caption', LECTURE_LAYOUT.caption, {
			fontFamily: NOTO_SANS,
			fontSize: 9,
			fontColor: '#A0B0C8',
			fontWeight: 400
		})
	]
};

export const templatePresets: SlideTemplate[] = [
	blankTemplate,
	modernDarkTemplate,
	softBlueTemplate
];

export function getTemplateById(id: string): SlideTemplate | undefined {
	return templatePresets.find((t) => t.id === id);
}

export { LECTURE_LAYOUT };
