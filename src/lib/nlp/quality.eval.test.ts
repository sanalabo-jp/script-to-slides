/**
 * Priority 4: Intl.Segmenter 분절 품질 평가
 * 실제 대본 예시로 토큰화 및 키워드 품질을 검증한다.
 */
import { describe, it, expect } from 'vitest';
import { tokenize, detectLanguage } from './tokenizer';
import { extractKeywords } from './keywordExtractor';
import { tokenizeSlides } from './index';
import type { SlideData } from '$lib/types';

// 실제 대본 예시 텍스트
const KO_SCRIPT =
	'WHO에 따르면 멘탈헬스란 단순히 질병이 없는 상태가 아닙니다. 직장인들의 스트레스 관리가 중요합니다. 인공지능과 머신러닝이 의료 분야를 혁신하고 있습니다.';

const EN_SCRIPT =
	'Artificial intelligence is transforming healthcare. Machine learning algorithms detect diseases early. Deep learning neural networks process medical data efficiently.';

const JA_SCRIPT = '人工知能は医療を変革しています。機械学習アルゴリズムは疾患を早期に検出します。';

const makeSlide = (context: string, lineNumber: number): SlideData => ({
	speaker: { name: '강사', role: '진행자' },
	context,
	metadata: {},
	visualHint: null,
	summary: null,
	image: null,
	detail: null,
	lineNumber
});

describe('품질 평가: 언어 감지 정확도', () => {
	it('한국어 대본을 ko로 감지한다', () => {
		expect(detectLanguage(KO_SCRIPT)).toBe('ko');
	});

	it('영어 대본을 en으로 감지한다', () => {
		expect(detectLanguage(EN_SCRIPT)).toBe('en');
	});

	it('일본어 대본을 ja로 감지한다', () => {
		expect(detectLanguage(JA_SCRIPT)).toBe('ja');
	});
});

describe('품질 평가: 한국어 토큰화', () => {
	it('핵심 명사 토큰이 포함된다', () => {
		const tokens = tokenize(KO_SCRIPT, { language: 'ko' });
		// 핵심 명사가 토큰에 포함되어야 함
		expect(tokens.some((t) => t.includes('멘탈헬스'))).toBe(true);
		expect(tokens.some((t) => t.includes('직장인'))).toBe(true);
		expect(tokens.some((t) => t.includes('인공지능'))).toBe(true);
		expect(tokens.some((t) => t.includes('머신러닝'))).toBe(true);
	});

	it('정지어가 필터링된다', () => {
		const tokens = tokenize(KO_SCRIPT, { language: 'ko' });
		expect(tokens).not.toContain('및');
		expect(tokens).not.toContain('또한');
		expect(tokens).not.toContain('그리고');
	});

	it('상위 키워드에 주제어가 포함된다', () => {
		const tokens = tokenize(KO_SCRIPT, { language: 'ko' });
		const { keywords } = extractKeywords(tokens, 5);
		// 최소 1개 이상의 의미있는 키워드가 포함되어야 함
		const meaningfulKeywords = keywords.filter((k) =>
			['멘탈헬스', '직장인', '인공지능', '머신러닝', '스트레스', '의료', '질병', '관리'].some(
				(ref) => k.includes(ref)
			)
		);
		expect(meaningfulKeywords.length).toBeGreaterThan(0);
	});
});

describe('품질 평가: 영어 토큰화', () => {
	it('핵심 명사 토큰이 포함된다', () => {
		const tokens = tokenize(EN_SCRIPT, { language: 'en' });
		expect(tokens).toContain('artificial');
		expect(tokens).toContain('intelligence');
		expect(tokens).toContain('machine');
		expect(tokens).toContain('learning');
	});

	it('상위 키워드가 주제어를 포함한다', () => {
		const tokens = tokenize(EN_SCRIPT, { language: 'en' });
		const { keywords } = extractKeywords(tokens, 5);
		const topKeywords = keywords.join(' ');
		// machine, learning, deep, neural 등 주제어 중 하나 이상 포함
		const hasRelevant = [
			'machine',
			'learning',
			'deep',
			'neural',
			'artificial',
			'intelligence'
		].some((k) => topKeywords.includes(k));
		expect(hasRelevant).toBe(true);
	});
});

describe('품질 평가: tokenizeSlides 통합', () => {
	it('다국어 대본에서 전역 키워드를 추출한다', () => {
		const slides = [makeSlide(KO_SCRIPT, 1), makeSlide(EN_SCRIPT, 2), makeSlide(JA_SCRIPT, 3)];
		const result = tokenizeSlides(slides);

		// 각 슬라이드에 토큰과 키워드가 있어야 함
		for (const slide of result.slides) {
			expect(slide.tokens.length).toBeGreaterThan(0);
			expect(slide.keywords.length).toBeGreaterThan(0);
		}

		// 전역 키워드가 존재해야 함
		expect(result.globalKeywords.length).toBeGreaterThan(0);
	});

	it('빈 슬라이드 배열은 빈 결과를 반환한다', () => {
		const result = tokenizeSlides([]);
		expect(result.slides).toEqual([]);
		expect(result.globalKeywords).toEqual([]);
	});

	it('lineNumber가 원본 슬라이드와 일치한다', () => {
		const slides = [makeSlide('인공지능 기술', 42), makeSlide('machine learning', 100)];
		const result = tokenizeSlides(slides);
		expect(result.slides[0].lineNumber).toBe(42);
		expect(result.slides[1].lineNumber).toBe(100);
	});
});

describe('품질 평가: Intl.Segmenter 한계 문서화', () => {
	it('[알려진 한계] 한국어 조사는 명사에 붙어 분절된다', () => {
		// "인공지능에" 가 "인공지능" 과 별도 토큰으로 분리되지 않음
		// 이는 조사 기반 형태소 분석 없이는 해결 불가 (Vercel Hobby 제약)
		const tokens = tokenize('인공지능에 대해', { language: 'ko' });
		// '인공지능에' 또는 '인공지능' 중 하나가 포함됨 (구현에 따라 다름)
		const hasAi = tokens.some((t) => t.startsWith('인공지능'));
		expect(hasAi).toBe(true);
	});

	it('[알려진 한계] 일본어는 단어 수준 분절이 불완전할 수 있다', () => {
		// "人工知能" → "人工", "知能" 으로 분리될 수 있음
		const tokens = tokenize('人工知能', { language: 'ja' });
		// 토큰이 1개 이상 있으면 분절됨
		expect(tokens.length).toBeGreaterThanOrEqual(1);
	});
});
