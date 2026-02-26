import { describe, it, expect } from 'vitest';
import { computeTF, extractKeywords } from './keywordExtractor';

describe('computeTF', () => {
	it('각 토큰의 Term Frequency를 계산한다', () => {
		const tf = computeTF(['apple', 'banana', 'apple', 'cherry', 'apple']);
		expect(tf['apple']).toBeCloseTo(3 / 5);
		expect(tf['banana']).toBeCloseTo(1 / 5);
		expect(tf['cherry']).toBeCloseTo(1 / 5);
	});

	it('단일 토큰은 TF=1.0을 반환한다', () => {
		const tf = computeTF(['keyword']);
		expect(tf['keyword']).toBeCloseTo(1.0);
	});

	it('빈 배열에 대해 빈 객체를 반환한다', () => {
		expect(computeTF([])).toEqual({});
	});

	it('동일 토큰이 여러 개일 때 빈도를 합산한다', () => {
		const tf = computeTF(['ai', 'ai', 'ai']);
		expect(tf['ai']).toBeCloseTo(1.0);
	});

	it('모든 TF 값의 합은 1.0이다', () => {
		const tokens = ['a', 'b', 'c', 'a', 'b'];
		const tf = computeTF(tokens);
		const total = Object.values(tf).reduce((sum, v) => sum + v, 0);
		expect(total).toBeCloseTo(1.0);
	});
});

describe('extractKeywords', () => {
	it('TF 점수가 높은 순으로 키워드를 반환한다', () => {
		const tokens = ['ai', 'ai', 'ai', 'machine', 'machine', 'learning'];
		const { keywords } = extractKeywords(tokens, 3);
		expect(keywords[0]).toBe('ai');
		expect(keywords[1]).toBe('machine');
		expect(keywords[2]).toBe('learning');
	});

	it('maxKeywords 이하로 반환한다', () => {
		const tokens = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
		const { keywords } = extractKeywords(tokens, 3);
		expect(keywords.length).toBeLessThanOrEqual(3);
	});

	it('토큰 수가 maxKeywords보다 적으면 전체를 반환한다', () => {
		const tokens = ['only', 'two'];
		const { keywords } = extractKeywords(tokens, 5);
		expect(keywords.length).toBe(2);
	});

	it('keywordScores에 TF 점수를 포함한다', () => {
		const tokens = ['ai', 'ai', 'machine'];
		const { keywordScores } = extractKeywords(tokens, 5);
		expect(keywordScores['ai']).toBeGreaterThan(keywordScores['machine']);
	});

	it('keywords와 keywordScores가 동일한 항목을 가진다', () => {
		const tokens = ['alpha', 'beta', 'alpha', 'gamma'];
		const { keywords, keywordScores } = extractKeywords(tokens, 10);
		for (const kw of keywords) {
			expect(keywordScores[kw]).toBeDefined();
		}
		expect(keywords.length).toBe(Object.keys(keywordScores).length);
	});

	it('빈 배열을 입력하면 빈 결과를 반환한다', () => {
		const { keywords, keywordScores } = extractKeywords([], 5);
		expect(keywords).toEqual([]);
		expect(keywordScores).toEqual({});
	});
});
