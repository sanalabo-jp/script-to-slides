import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from './prompts';
import type { ScriptLine } from '$lib/types';

function makeLine(overrides: Partial<ScriptLine> = {}): ScriptLine {
	return {
		speaker: '강사',
		role: '진행자',
		dialogue: '안녕하세요.',
		lineNumber: 1,
		...overrides
	};
}

describe('buildAnalysisPrompt', () => {
	// === 정상 입력 (단일 화자) ===

	it('단일 화자 — 스크립트 텍스트 포맷 포함', () => {
		const lines = [makeLine()];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('[Line 1] 강사[진행자]: 안녕하세요.');
	});

	it('단일 화자 — Context 섹션에 lines/speakers 수 반영', () => {
		const lines = [makeLine()];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('1 lines from 1 speakers');
	});

	it('단일 화자 — speakerRoleMap 포함', () => {
		const lines = [makeLine()];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('"강사": role="진행자"');
	});

	it('단일 화자 — slide entries 수 명시', () => {
		const lines = [makeLine()];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('exactly 1 slide entries');
	});

	it('단일 화자 — JSON 예시에 화자명 포함', () => {
		const lines = [makeLine()];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('"강사"');
	});

	// === 복수 화자 ===

	it('복수 화자 — 고유 화자 추출', () => {
		const lines = [
			makeLine({ speaker: 'A', role: '앵커', lineNumber: 1 }),
			makeLine({ speaker: 'B', role: '기자', lineNumber: 2 }),
			makeLine({ speaker: 'A', role: '앵커', lineNumber: 3 })
		];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('3 lines from 2 speakers');
	});

	it('복수 화자 — 모든 화자의 speakerRoleMap 포함', () => {
		const lines = [
			makeLine({ speaker: 'A', role: '앵커', lineNumber: 1 }),
			makeLine({ speaker: 'B', role: '기자', lineNumber: 2 })
		];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('"A": role="앵커"');
		expect(result).toContain('"B": role="기자"');
	});

	it('복수 화자 — Theme keys 규칙에 모든 화자명 나열', () => {
		const lines = [
			makeLine({ speaker: '진행자', role: 'MC', lineNumber: 1 }),
			makeLine({ speaker: '패널', role: '전문가', lineNumber: 2 })
		];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('"진행자", "패널"');
	});

	// === description 처리 ===

	it('description 있음 → (description) 포함', () => {
		const lines = [makeLine({ description: 'WHO 로고 표시' })];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('[Line 1] 강사[진행자]: (WHO 로고 표시) 안녕하세요.');
	});

	it('description 없음 → 괄호 없이 대사만', () => {
		const lines = [makeLine({ description: undefined })];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('[Line 1] 강사[진행자]: 안녕하세요.');
		expect(result).not.toContain('()');
	});

	it('description 빈 문자열 → 빈 괄호 포함', () => {
		const lines = [makeLine({ description: '' })];
		const result = buildAnalysisPrompt(lines);
		// description이 빈 문자열이면 falsy → 괄호 미포함
		expect(result).toContain('[Line 1] 강사[진행자]: 안녕하세요.');
		expect(result).not.toContain('() ');
	});

	// === 빈 배열 ===

	it('빈 배열 → 오류 없이 프롬프트 생성', () => {
		const result = buildAnalysisPrompt([]);
		expect(result).toContain('0 lines from 0 speakers');
	});

	it('빈 배열 → exactly 0 slide entries', () => {
		const result = buildAnalysisPrompt([]);
		expect(result).toContain('exactly 0 slide entries');
	});

	// === 출력 구조 검증 ===

	it('프롬프트에 핵심 섹션 포함', () => {
		const lines = [makeLine()];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('## Context');
		expect(result).toContain('## Script');
		expect(result).toContain('## Instructions');
		expect(result).toContain('## Required Output Format');
		expect(result).toContain('## Critical Rules');
	});

	it('반환값이 문자열', () => {
		const result = buildAnalysisPrompt([makeLine()]);
		expect(typeof result).toBe('string');
	});

	// === lineNumber 반영 ===

	it('여러 줄 — lineNumber 순서대로 포맷', () => {
		const lines = [
			makeLine({ speaker: 'A', dialogue: '첫 번째', lineNumber: 1 }),
			makeLine({ speaker: 'B', dialogue: '두 번째', lineNumber: 2 }),
			makeLine({ speaker: 'A', dialogue: '세 번째', lineNumber: 3 })
		];
		const result = buildAnalysisPrompt(lines);
		expect(result).toContain('[Line 1] A[진행자]: 첫 번째');
		expect(result).toContain('[Line 2] B[진행자]: 두 번째');
		expect(result).toContain('[Line 3] A[진행자]: 세 번째');
	});
});
