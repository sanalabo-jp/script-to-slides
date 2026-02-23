import { describe, it, expect } from 'vitest';
import { themeToSlideConfig } from './themeEngine';
import type { SlideTheme } from '$lib/types';

function makeTheme(overrides: Partial<SlideTheme> = {}): SlideTheme {
	return {
		backgroundColor: '#F8F9FA',
		primaryColor: '#1A1A2E',
		accentColor: '#636E72',
		fontFamily: 'Arial',
		mood: 'professional',
		...overrides
	};
}

describe('themeToSlideConfig', () => {
	// === mood별 폰트 크기 매핑 ===

	it('professional → title 28, body 20, caption 14', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'professional' }));
		expect(result.titleStyle.fontSize).toBe(28);
		expect(result.bodyStyle.fontSize).toBe(20);
		expect(result.captionStyle.fontSize).toBe(14);
	});

	it('casual → title 32, body 22, caption 14', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'casual' }));
		expect(result.titleStyle.fontSize).toBe(32);
		expect(result.bodyStyle.fontSize).toBe(22);
		expect(result.captionStyle.fontSize).toBe(14);
	});

	it('dramatic → title 36, body 24, caption 16', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'dramatic' }));
		expect(result.titleStyle.fontSize).toBe(36);
		expect(result.bodyStyle.fontSize).toBe(24);
		expect(result.captionStyle.fontSize).toBe(16);
	});

	it('warm → title 30, body 22, caption 14', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'warm' }));
		expect(result.titleStyle.fontSize).toBe(30);
		expect(result.bodyStyle.fontSize).toBe(22);
		expect(result.captionStyle.fontSize).toBe(14);
	});

	it('serious → title 26, body 18, caption 12', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'serious' }));
		expect(result.titleStyle.fontSize).toBe(26);
		expect(result.bodyStyle.fontSize).toBe(18);
		expect(result.captionStyle.fontSize).toBe(12);
	});

	it('playful → title 34, body 24, caption 16', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'playful' }));
		expect(result.titleStyle.fontSize).toBe(34);
		expect(result.bodyStyle.fontSize).toBe(24);
		expect(result.captionStyle.fontSize).toBe(16);
	});

	// === 색상 변환 (safeColor 간접 검증) ===

	it('# 접두사가 있는 색상 → # 제거된 값 반환', () => {
		const result = themeToSlideConfig(
			makeTheme({
				backgroundColor: '#AABBCC',
				primaryColor: '#112233',
				accentColor: '#445566'
			})
		);
		expect(result.background.color).toBe('AABBCC');
		expect(result.titleStyle.color).toBe('112233');
		expect(result.accentColor).toBe('445566');
	});

	it('# 없는 색상 → 그대로 반환', () => {
		const result = themeToSlideConfig(
			makeTheme({
				backgroundColor: 'AABBCC',
				primaryColor: '112233',
				accentColor: '445566'
			})
		);
		expect(result.background.color).toBe('AABBCC');
		expect(result.titleStyle.color).toBe('112233');
		expect(result.accentColor).toBe('445566');
	});

	it('빈 문자열 색상 → fallback 값 사용', () => {
		const result = themeToSlideConfig(
			makeTheme({
				backgroundColor: '',
				primaryColor: '',
				accentColor: ''
			})
		);
		expect(result.background.color).toBe('F8F9FA');
		expect(result.titleStyle.color).toBe('1A1A2E');
		expect(result.bodyStyle.color).toBe('2D3436');
		expect(result.captionStyle.color).toBe('636E72');
		expect(result.accentColor).toBe('636E72');
	});

	it('비문자열 색상 → fallback 값 사용', () => {
		const result = themeToSlideConfig(
			makeTheme({
				backgroundColor: undefined as unknown as string,
				primaryColor: null as unknown as string,
				accentColor: 123 as unknown as string
			})
		);
		expect(result.background.color).toBe('F8F9FA');
		expect(result.titleStyle.color).toBe('1A1A2E');
		expect(result.accentColor).toBe('636E72');
	});

	// === 기본값/fallback 처리 ===

	it('미등록 mood → professional 크기로 fallback', () => {
		const result = themeToSlideConfig(makeTheme({ mood: 'unknown-mood' }));
		expect(result.titleStyle.fontSize).toBe(28);
		expect(result.bodyStyle.fontSize).toBe(20);
		expect(result.captionStyle.fontSize).toBe(14);
		expect(result.mood).toBe('unknown-mood');
	});

	it('비문자열 mood → "professional" 문자열 + professional 크기', () => {
		const result = themeToSlideConfig(
			makeTheme({
				mood: undefined as unknown as string
			})
		);
		expect(result.mood).toBe('professional');
		expect(result.titleStyle.fontSize).toBe(28);
	});

	it('비문자열 fontFamily → "Arial" fallback', () => {
		const result = themeToSlideConfig(
			makeTheme({
				fontFamily: null as unknown as string
			})
		);
		expect(result.titleStyle.fontFace).toBe('Arial');
		expect(result.bodyStyle.fontFace).toBe('Arial');
		expect(result.captionStyle.fontFace).toBe('Arial');
	});

	// === 반환 구조 전체 검증 ===

	it('정상 입력 → 완전한 PptxTheme 구조 반환', () => {
		const result = themeToSlideConfig(
			makeTheme({
				backgroundColor: '#FFFFFF',
				primaryColor: '#000000',
				accentColor: '#FF5733',
				fontFamily: 'Noto Sans',
				mood: 'casual'
			})
		);
		expect(result).toEqual({
			background: { color: 'FFFFFF' },
			titleStyle: {
				color: '000000',
				fontFace: 'Noto Sans',
				fontSize: 32,
				bold: true
			},
			bodyStyle: {
				color: '000000',
				fontFace: 'Noto Sans',
				fontSize: 22
			},
			captionStyle: {
				color: 'FF5733',
				fontFace: 'Noto Sans',
				fontSize: 14,
				italic: true
			},
			accentColor: 'FF5733',
			mood: 'casual'
		});
	});
});
