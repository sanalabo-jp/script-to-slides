import { describe, it, expect } from 'vitest';
import { lightenColor } from './colorUtils';

describe('lightenColor', () => {
	// === 기본 밝기 조정 ===

	it('검정색을 50% 밝게 → #808080', () => {
		expect(lightenColor('#000000', 50)).toBe('#808080');
	});

	it('진한 파란색을 50% 밝게 → 각 채널 독립 계산', () => {
		// #003366 → r=0, g=51, b=102
		// r: round(0 + 255*0.5) = 128
		// g: round(51 + 204*0.5) = 153
		// b: round(102 + 153*0.5) = 179
		expect(lightenColor('#003366', 50)).toBe('#8099b3');
	});

	it('빨간색을 30% 밝게 → 녹색/파란색 채널만 변화', () => {
		// #ff0000 → r=255, g=0, b=0
		// r: min(255, round(255 + 0*0.3)) = 255
		// g: round(0 + 255*0.3) = 77
		// b: same = 77
		expect(lightenColor('#ff0000', 30)).toBe('#ff4d4d');
	});

	it('중간 회색을 50% 밝게 → #c0c0c0', () => {
		// #808080 → r=g=b=128
		// round(128 + 127*0.5) = round(191.5) = 192
		expect(lightenColor('#808080', 50)).toBe('#c0c0c0');
	});

	// === 경계값 ===

	it('0% → 색상 변화 없음', () => {
		expect(lightenColor('#ff5733', 0)).toBe('#ff5733');
	});

	it('100% → 항상 흰색', () => {
		expect(lightenColor('#ff5733', 100)).toBe('#ffffff');
	});

	it('흰색 입력 → 어떤 percent든 흰색 유지', () => {
		expect(lightenColor('#ffffff', 50)).toBe('#ffffff');
	});

	// === hex 형식 변형 ===

	it('# 없는 hex도 정상 처리', () => {
		expect(lightenColor('000000', 50)).toBe('#808080');
	});

	it('잘못된 hex → fallback 회색(128,128,128) 기준으로 계산', () => {
		// hexToRgb fallback: {128, 128, 128}
		// round(128 + 127*0.5) = 192
		expect(lightenColor('invalid', 50)).toBe('#c0c0c0');
	});
});
