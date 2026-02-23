import { describe, it, expect } from 'vitest';
import { generateSpeakerColor, lightenColor } from './colorUtils';

describe('generateSpeakerColor', () => {
	// === 반환 형식 ===

	it('유효한 hex 색상 문자열 형식 반환 (#rrggbb)', () => {
		const color = generateSpeakerColor();
		expect(color).toMatch(/^#[0-9a-f]{6}$/i);
	});

	// === 연속 호출 (동일 이름 반복 시뮬레이션) ===

	it('연속 호출 — 모두 유효한 hex 색상 반환', () => {
		for (let i = 0; i < 5; i++) {
			const color = generateSpeakerColor();
			expect(color).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	// === PRESET_COLORS 순환 (빈 배열 방어) ===

	it('PRESET_COLORS 전체 순환 후에도 유효한 hex 반환 (index wrap)', () => {
		// PRESET_COLORS.length(10)개 이상 호출 시 순환
		const colors: string[] = [];
		for (let i = 0; i < 12; i++) {
			const c = generateSpeakerColor();
			expect(c).toMatch(/^#[0-9a-f]{6}$/i);
			colors.push(c);
		}
		expect(colors).toHaveLength(12);
	});

	// === RGB 범위 검증 ===

	it('반환 색상의 RGB 채널이 모두 0-255 범위 내', () => {
		const hex = generateSpeakerColor();
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		expect(r).toBeGreaterThanOrEqual(0);
		expect(r).toBeLessThanOrEqual(255);
		expect(g).toBeGreaterThanOrEqual(0);
		expect(g).toBeLessThanOrEqual(255);
		expect(b).toBeGreaterThanOrEqual(0);
		expect(b).toBeLessThanOrEqual(255);
	});
});

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
