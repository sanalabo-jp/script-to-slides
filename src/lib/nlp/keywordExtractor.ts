/**
 * 토큰 배열에서 Term Frequency(TF)를 계산한다.
 * TF = 해당 토큰 출현 횟수 / 전체 토큰 수
 */
export function computeTF(tokens: string[]): Record<string, number> {
	if (tokens.length === 0) return {};

	const counts: Record<string, number> = {};
	for (const token of tokens) {
		counts[token] = (counts[token] ?? 0) + 1;
	}

	const total = tokens.length;
	const tf: Record<string, number> = {};
	for (const [token, count] of Object.entries(counts)) {
		tf[token] = count / total;
	}

	return tf;
}

/**
 * TF 점수 기반으로 상위 키워드를 추출한다.
 * - 입력 토큰은 이미 정지어가 제거된 상태를 가정
 * - TF 내림차순으로 maxKeywords개 반환
 */
export function extractKeywords(
	tokens: string[],
	maxKeywords: number
): { keywords: string[]; keywordScores: Record<string, number> } {
	if (tokens.length === 0) {
		return { keywords: [], keywordScores: {} };
	}

	const tf = computeTF(tokens);
	const sorted = Object.entries(tf)
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxKeywords);

	return {
		keywords: sorted.map(([token]) => token),
		keywordScores: Object.fromEntries(sorted)
	};
}
