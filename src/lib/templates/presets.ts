import type { SlideTemplate } from '$lib/types';

const NOTO_SANS = 'Noto Sans';

export const blankTemplate: SlideTemplate = {
  id: 'blank',
  name: 'Blank',
  description: '깔끔한 흰 배경의 기본 템플릿',
  thumbnail: '/thumbnails/blank.svg',
  background: {
    color: '#FFFFFF',
  },
  styles: {
    callout1Label: {
      fontFamily: NOTO_SANS,
      fontSize: 11,
      fontColor: '#999999',
      fontWeight: 400,
    },
    callout2Label: {
      fontFamily: NOTO_SANS,
      fontSize: 10,
      fontColor: '#BBBBBB',
      fontWeight: 400,
    },
    titleLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 14,
      fontColor: '#434343',
      fontWeight: 700,
    },
    bodyLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 12,
      fontColor: '#434343',
      fontWeight: 500,
    },
    captionLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 9,
      fontColor: '#C0C0C0',
      fontWeight: 400,
    },
  },
};

export const modernDarkTemplate: SlideTemplate = {
  id: 'modern-dark',
  name: 'Modern Dark',
  description: '어두운 배경의 모던한 템플릿',
  thumbnail: '/thumbnails/modern-dark.svg',
  background: {
    color: '#1A1A2E',
  },
  styles: {
    callout1Label: {
      fontFamily: NOTO_SANS,
      fontSize: 11,
      fontColor: '#8888AA',
      fontWeight: 400,
    },
    callout2Label: {
      fontFamily: NOTO_SANS,
      fontSize: 10,
      fontColor: '#666688',
      fontWeight: 400,
    },
    titleLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 14,
      fontColor: '#E0E0E0',
      fontWeight: 700,
    },
    bodyLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 12,
      fontColor: '#CCCCCC',
      fontWeight: 500,
    },
    captionLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 9,
      fontColor: '#555577',
      fontWeight: 400,
    },
  },
};

export const softBlueTemplate: SlideTemplate = {
  id: 'soft-blue',
  name: 'Soft Blue',
  description: '부드러운 블루 톤의 전문적인 템플릿',
  thumbnail: '/thumbnails/soft-blue.svg',
  background: {
    color: '#F0F4FA',
  },
  styles: {
    callout1Label: {
      fontFamily: NOTO_SANS,
      fontSize: 11,
      fontColor: '#7A8BAE',
      fontWeight: 400,
    },
    callout2Label: {
      fontFamily: NOTO_SANS,
      fontSize: 10,
      fontColor: '#9AABC8',
      fontWeight: 400,
    },
    titleLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 14,
      fontColor: '#26489D',
      fontWeight: 700,
    },
    bodyLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 12,
      fontColor: '#2D3748',
      fontWeight: 500,
    },
    captionLabel: {
      fontFamily: NOTO_SANS,
      fontSize: 9,
      fontColor: '#A0B0C8',
      fontWeight: 400,
    },
  },
};

export const templatePresets: SlideTemplate[] = [
  blankTemplate,
  modernDarkTemplate,
  softBlueTemplate,
];

export function getTemplateById(id: string): SlideTemplate | undefined {
  return templatePresets.find((t) => t.id === id);
}
