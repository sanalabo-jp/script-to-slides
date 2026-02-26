import type { TokenizerConfig, SupportedLanguage, DetectedLanguage } from '$lib/types';
import { getStopwords, getCombinedStopwords } from './stopwords';

const KO_CHAR_RE = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
const JA_CHAR_RE = /[\u3040-\u30FF]/;
const LA_CHAR_RE = /[a-zA-Z]/;
const ASCII_ALPHA_RE = /^[a-zA-Z]+$/;
const DIGITS_ONLY_RE = /^\d+$/;

/** 텍스트에서 지배적인 언어를 감지한다 */
export function detectLanguage(text: string): DetectedLanguage {
	let koCount = 0;
	let jaCount = 0;
	let laCount = 0;

	for (const ch of text) {
		if (KO_CHAR_RE.test(ch)) koCount++;
		else if (JA_CHAR_RE.test(ch)) jaCount++;
		else if (LA_CHAR_RE.test(ch)) laCount++;
	}

	const total = koCount + jaCount + laCount;
	if (total === 0) return 'en';

	if (koCount / total >= 0.4) return 'ko';
	if (jaCount / total >= 0.4) return 'ja';
	if (laCount / total >= 0.6) return 'en';
	return 'mixed';
}

/**
 * 텍스트를 토큰 배열로 변환한다.
 * - Intl.Segmenter 기반 다국어 분절
 * - 순수 숫자, 정지어, 최소 길이 미만 토큰 제거
 * - ASCII 단어는 소문자로 정규화
 */
export function tokenize(text: string, config?: TokenizerConfig): string[] {
	if (!text) return [];

	const minLen = config?.minTokenLength ?? 2;

	const detectedLang = detectLanguage(text);
	const lang: SupportedLanguage | 'mixed' =
		config?.language && config.language !== 'auto'
			? (config.language as SupportedLanguage)
			: detectedLang;

	// 'mixed'는 한국어 로케일을 기본으로 사용 (Korean-first 프로젝트)
	const locale: string = lang === 'mixed' ? 'ko' : lang;

	const stopwords =
		lang === 'mixed'
			? getCombinedStopwords(['ko', 'en', 'ja'])
			: getStopwords(lang as SupportedLanguage);

	const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
	const tokens: string[] = [];

	for (const { segment, isWordLike } of segmenter.segment(text)) {
		if (!isWordLike) continue;

		// ASCII 알파벳 단어는 소문자로 정규화
		const normalized = ASCII_ALPHA_RE.test(segment) ? segment.toLowerCase() : segment;

		if (normalized.length < minLen) continue;
		if (DIGITS_ONLY_RE.test(normalized)) continue;
		if (stopwords.has(normalized)) continue;

		tokens.push(normalized);
	}

	return tokens;
}
