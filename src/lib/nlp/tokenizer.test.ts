import { describe, it, expect } from 'vitest';
import { detectLanguage, tokenize } from './tokenizer';

describe('detectLanguage', () => {
	it('한국어 텍스트를 감지한다', () => {
		expect(detectLanguage('안녕하세요 인공지능에 대해 이야기합니다')).toBe('ko');
	});

	it('영어 텍스트를 감지한다', () => {
		expect(detectLanguage('Hello world artificial intelligence machine learning')).toBe('en');
	});

	it('일본어 텍스트를 감지한다', () => {
		expect(detectLanguage('こんにちは 人工知能について話します')).toBe('ja');
	});

	it('빈 문자열에 대해 en을 기본값으로 반환한다', () => {
		expect(detectLanguage('')).toBe('en');
	});

	it('숫자/특수문자만 있으면 en을 반환한다', () => {
		expect(detectLanguage('123 456 !@#')).toBe('en');
	});
});

describe('tokenize', () => {
	describe('영어 토큰화', () => {
		it('단어를 소문자로 정규화한다', () => {
			const tokens = tokenize('Hello World Test', { language: 'en' });
			expect(tokens).toContain('hello');
			expect(tokens).toContain('world');
			expect(tokens).toContain('test');
			expect(tokens).not.toContain('Hello');
		});

		it('정지어를 제거한다', () => {
			const tokens = tokenize('This is a test sentence for learning', { language: 'en' });
			expect(tokens).not.toContain('this');
			expect(tokens).not.toContain('is');
			expect(tokens).not.toContain('a');
			expect(tokens).not.toContain('for');
			expect(tokens).toContain('test');
			expect(tokens).toContain('sentence');
			expect(tokens).toContain('learning');
		});

		it('최소 길이 미만 토큰을 제거한다', () => {
			const tokens = tokenize('big machine learning deep', { language: 'en', minTokenLength: 4 });
			expect(tokens).not.toContain('big'); // 3자 → 제거
			expect(tokens).toContain('machine'); // 7자 → 포함
			expect(tokens).toContain('learning'); // 8자 → 포함
		});

		it('순수 숫자를 제거한다', () => {
			const tokens = tokenize('123 test 456 result', { language: 'en' });
			expect(tokens).not.toContain('123');
			expect(tokens).not.toContain('456');
			expect(tokens).toContain('test');
			expect(tokens).toContain('result');
		});
	});

	describe('한국어 토큰화', () => {
		it('한국어 단어를 토큰화한다', () => {
			const tokens = tokenize('인공지능에 대해 이야기합니다', { language: 'ko' });
			expect(tokens.length).toBeGreaterThan(0);
		});

		it('한국어 독립 정지어를 제거한다', () => {
			const tokens = tokenize('인공지능 등 새로운 기술 그리고 머신러닝', { language: 'ko' });
			expect(tokens).not.toContain('등');
			expect(tokens).not.toContain('그리고');
			expect(tokens).not.toContain('새로운');
			expect(tokens).toContain('인공지능');
			expect(tokens).toContain('기술');
		});

		it('기본 길이(2) 미만 토큰을 제거한다', () => {
			const tokens = tokenize('AI 머신러닝', { language: 'ko' });
			// 'AI'는 2자이므로 포함 (minTokenLength 기본값은 2)
			// 단, 소문자화: 'ai'
			expect(tokens).toContain('ai');
			expect(tokens).toContain('머신러닝');
		});
	});

	describe('일본어 토큰화', () => {
		it('일본어 단어를 토큰화한다', () => {
			const tokens = tokenize('人工知能について話します', { language: 'ja' });
			expect(tokens.length).toBeGreaterThan(0);
		});

		it('일본어 정지어를 제거한다', () => {
			const tokens = tokenize('人工知能 について 話します', { language: 'ja' });
			expect(tokens).not.toContain('について');
		});
	});

	describe('언어 자동 감지', () => {
		it('language: auto 설정 시 언어를 자동 감지한다', () => {
			const tokens = tokenize('Hello world test sentence', { language: 'auto' });
			expect(tokens).toContain('hello');
			expect(tokens).toContain('world');
		});

		it('language 미지정 시 자동 감지를 사용한다', () => {
			const tokens = tokenize('인공지능 머신러닝 딥러닝');
			expect(tokens.length).toBeGreaterThan(0);
			expect(tokens).toContain('인공지능');
		});
	});

	describe('에지 케이스', () => {
		it('빈 문자열을 빈 배열로 반환한다', () => {
			expect(tokenize('')).toEqual([]);
		});

		it('정지어만 있는 텍스트는 빈 배열을 반환한다', () => {
			const tokens = tokenize('this is a the', { language: 'en' });
			expect(tokens).toEqual([]);
		});

		it('혼합 언어(영어+한국어)를 처리한다', () => {
			const tokens = tokenize('AI 기술 machine learning 머신러닝');
			expect(tokens.length).toBeGreaterThan(0);
		});
	});
});
