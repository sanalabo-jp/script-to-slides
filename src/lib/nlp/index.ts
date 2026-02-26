import type {
	SlideData,
	SlideTokenData,
	TokenizationResult,
	TokenizerConfig,
	DetectedLanguage
} from '$lib/types';
import { tokenize, detectLanguage } from './tokenizer';
import { extractKeywords } from './keywordExtractor';

export { detectLanguage, tokenize } from './tokenizer';
export { computeTF, extractKeywords } from './keywordExtractor';
export { getStopwords, getCombinedStopwords } from './stopwords';

/**
 * SlideData 배열의 context 필드를 토큰화하고 키워드를 추출한다.
 * 소비자: 기능3 (이미지 검색 쿼리), 기능5 하위 모듈
 */
export function tokenizeSlides(slides: SlideData[], config?: TokenizerConfig): TokenizationResult {
	const maxKeywords = config?.maxKeywords ?? 5;

	// 전체 텍스트에서 지배적 언어 감지
	const allText = slides.map((s) => s.context).join(' ');
	const language: DetectedLanguage = detectLanguage(allText);

	const tokenizedSlides: SlideTokenData[] = slides.map((slide) => {
		const tokens = tokenize(slide.context, config);
		const { keywords, keywordScores } = extractKeywords(tokens, maxKeywords);
		return {
			lineNumber: slide.lineNumber,
			tokens,
			keywords,
			keywordScores
		};
	});

	// 전체 토큰 풀에서 전역 키워드 집계
	const allTokens = tokenizedSlides.flatMap((s) => s.tokens);
	const { keywords: globalKeywords } = extractKeywords(allTokens, maxKeywords * 2);

	return {
		slides: tokenizedSlides,
		globalKeywords,
		language
	};
}

/**
 * SlideData 배열에 토큰 데이터를 결합하여 반환한다.
 * 소비자: 이미지 검색 쿼리 생성, 템플릿 추천 등 downstream 기능
 */
export function enrichSlideData(
	slides: SlideData[],
	config?: TokenizerConfig
): Array<SlideData & { tokenData: SlideTokenData }> {
	const result = tokenizeSlides(slides, config);
	return slides.map((slide, i) => ({
		...slide,
		tokenData: result.slides[i]
	}));
}
