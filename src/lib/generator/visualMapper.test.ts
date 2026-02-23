import { describe, it, expect } from 'vitest';
import { visualToShapeConfig, getBackgroundConfig } from './visualMapper';
import type { SlideVisual } from '$lib/types';

function makeVisual(overrides: Partial<SlideVisual> = {}): SlideVisual {
	return {
		shapeType: 'rectangle',
		shapeColor: '#FF5733',
		position: 'top-right',
		...overrides
	};
}

describe('visualToShapeConfig', () => {
	// === SHAPE_MAP 매핑 ===

	it('rectangle → rect', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'rectangle' }));
		expect(result).not.toBeNull();
		expect(result!.shapeName).toBe('rect');
	});

	it('circle → ellipse', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'circle' }));
		expect(result!.shapeName).toBe('ellipse');
	});

	it('arrow → rightArrow', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'arrow' }));
		expect(result!.shapeName).toBe('rightArrow');
	});

	it('star → star5', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'star' }));
		expect(result!.shapeName).toBe('star5');
	});

	it('diamond → diamond', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'diamond' }));
		expect(result!.shapeName).toBe('diamond');
	});

	it('triangle → triangle', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'triangle' }));
		expect(result!.shapeName).toBe('triangle');
	});

	it('cloud → cloud', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'cloud' }));
		expect(result!.shapeName).toBe('cloud');
	});

	it('heart → heart', () => {
		const result = visualToShapeConfig(makeVisual({ shapeType: 'heart' }));
		expect(result!.shapeName).toBe('heart');
	});

	// === null 반환 조건 ===

	it('shapeType "none" → null', () => {
		expect(visualToShapeConfig(makeVisual({ shapeType: 'none' }))).toBeNull();
	});

	it('미등록 shapeType → null', () => {
		expect(visualToShapeConfig(makeVisual({ shapeType: 'hexagon' }))).toBeNull();
	});

	it('비문자열 shapeType → null (typeof 분기 → "none" fallback)', () => {
		expect(
			visualToShapeConfig(makeVisual({ shapeType: undefined as unknown as string }))
		).toBeNull();
	});

	// === POSITION_MAP 좌표 매핑 ===

	it('background → {x:0, y:0, w:10, h:5.63}', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'background' }));
		expect(result!.x).toBe(0);
		expect(result!.y).toBe(0);
		expect(result!.w).toBe(10);
		expect(result!.h).toBe(5.63);
	});

	it('top-right → {x:8.0, y:0.3, w:1.5, h:1.5}', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'top-right' }));
		expect(result!.x).toBe(8.0);
		expect(result!.y).toBe(0.3);
		expect(result!.w).toBe(1.5);
		expect(result!.h).toBe(1.5);
	});

	it('bottom-left → {x:0.5, y:3.8, w:1.5, h:1.5}', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'bottom-left' }));
		expect(result!.x).toBe(0.5);
		expect(result!.y).toBe(3.8);
	});

	it('center-back → {x:3.5, y:1.5, w:3, h:3}', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'center-back' }));
		expect(result!.x).toBe(3.5);
		expect(result!.y).toBe(1.5);
		expect(result!.w).toBe(3);
		expect(result!.h).toBe(3);
	});

	it('미등록 position → top-right fallback', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'unknown-position' }));
		expect(result!.x).toBe(8.0);
		expect(result!.y).toBe(0.3);
	});

	it('비문자열 position → top-right fallback', () => {
		const result = visualToShapeConfig(makeVisual({ position: null as unknown as string }));
		expect(result!.x).toBe(8.0);
		expect(result!.y).toBe(0.3);
	});

	// === opacity 할당 ===

	it('background position → opacity 0.15', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'background' }));
		expect(result!.opacity).toBe(0.15);
	});

	it('center-back position → opacity 0.15', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'center-back' }));
		expect(result!.opacity).toBe(0.15);
	});

	it('top-right position → opacity 0.6', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'top-right' }));
		expect(result!.opacity).toBe(0.6);
	});

	it('bottom-left position → opacity 0.6', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'bottom-left' }));
		expect(result!.opacity).toBe(0.6);
	});

	it('left-side position → opacity 0.6', () => {
		const result = visualToShapeConfig(makeVisual({ position: 'left-side' }));
		expect(result!.opacity).toBe(0.6);
	});

	// === safeColor 간접 검증 ===

	it('# 접두사 색상 → # 제거', () => {
		const result = visualToShapeConfig(makeVisual({ shapeColor: '#AABBCC' }));
		expect(result!.fill.color).toBe('AABBCC');
	});

	it('# 없는 색상 → 그대로 반환', () => {
		const result = visualToShapeConfig(makeVisual({ shapeColor: 'AABBCC' }));
		expect(result!.fill.color).toBe('AABBCC');
	});

	it('빈 문자열 색상 → fallback "636E72"', () => {
		const result = visualToShapeConfig(makeVisual({ shapeColor: '' }));
		expect(result!.fill.color).toBe('636E72');
	});

	it('비문자열 색상 → fallback "636E72"', () => {
		const result = visualToShapeConfig(makeVisual({ shapeColor: undefined as unknown as string }));
		expect(result!.fill.color).toBe('636E72');
	});

	// === 반환 구조 전체 검증 ===

	it('정상 입력 → 완전한 PptxVisualElement 구조 반환', () => {
		const result = visualToShapeConfig(
			makeVisual({
				shapeType: 'circle',
				shapeColor: '#00FF00',
				position: 'right-side'
			})
		);
		expect(result).toEqual({
			shapeName: 'ellipse',
			x: 8.5,
			y: 1.5,
			w: 1.2,
			h: 2.5,
			fill: { color: '00FF00' },
			opacity: 0.6
		});
	});
});

describe('getBackgroundConfig', () => {
	// === gradient 감지 ===

	it('backgroundGradient 있음 → from 색상 사용', () => {
		const visual = makeVisual({
			backgroundGradient: { from: '#1A2B3C', to: '#FFFFFF' }
		});
		const result = getBackgroundConfig(visual, '#000000');
		expect(result.color).toBe('1A2B3C');
	});

	it('backgroundGradient 없음 → themeBackgroundColor 사용', () => {
		const visual = makeVisual();
		const result = getBackgroundConfig(visual, '#AABBCC');
		expect(result.color).toBe('AABBCC');
	});

	// === fallback 체인 ===

	it('gradient.from 빈 문자열 + 유효한 themeBackgroundColor → themeBackgroundColor fallback', () => {
		const visual = makeVisual({
			backgroundGradient: { from: '', to: '#FFFFFF' }
		});
		const result = getBackgroundConfig(visual, '#123456');
		expect(result.color).toBe('123456');
	});

	it('gradient.from 빈 문자열 + themeBackgroundColor 빈 문자열 → "F8F9FA" fallback', () => {
		const visual = makeVisual({
			backgroundGradient: { from: '', to: '#FFFFFF' }
		});
		const result = getBackgroundConfig(visual, '');
		expect(result.color).toBe('F8F9FA');
	});

	it('themeBackgroundColor 빈 문자열 (no gradient) → "F8F9FA" fallback', () => {
		const visual = makeVisual();
		const result = getBackgroundConfig(visual, '');
		expect(result.color).toBe('F8F9FA');
	});

	it('비문자열 themeBackgroundColor (no gradient) → "F8F9FA" fallback', () => {
		const visual = makeVisual();
		const result = getBackgroundConfig(visual, undefined as unknown as string);
		expect(result.color).toBe('F8F9FA');
	});

	it('# 접두사 themeBackgroundColor → # 제거', () => {
		const visual = makeVisual();
		const result = getBackgroundConfig(visual, '#DDEEFF');
		expect(result.color).toBe('DDEEFF');
	});

	it('# 접두사 gradient.from → # 제거', () => {
		const visual = makeVisual({
			backgroundGradient: { from: '#AABB00', to: '#FFFFFF' }
		});
		const result = getBackgroundConfig(visual, '#000000');
		expect(result.color).toBe('AABB00');
	});
});
