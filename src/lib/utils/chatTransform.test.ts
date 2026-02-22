import { describe, it, expect } from 'vitest';
import { buildParseResult } from './chatTransform';
import { ScriptType } from '$lib/types';
import type { ChatMessage, SpeakerProfile, ScriptFrontMatter } from '$lib/types';

// === 테스트 헬퍼 ===

const defaultFrontMatter: ScriptFrontMatter = {
	type: ScriptType.General,
	topic: '테스트 주제',
	categories: ['교육']
};

function makeSpeaker(overrides: Partial<SpeakerProfile> = {}): SpeakerProfile {
	return {
		id: 's1',
		name: '강사',
		role: '진행자',
		color: '#333',
		isDefault: true,
		...overrides
	};
}

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
	return {
		id: 'm1',
		speakerId: 's1',
		dialogue: '안녕하세요',
		visualHint: '',
		metadata: {},
		timestamp: Date.now(),
		isEditing: false,
		isEdited: false,
		...overrides
	};
}

describe('buildParseResult', () => {
	// === 정상 입력 ===

	it('단일 메시지 — 올바른 슬라이드와 메타데이터 생성', () => {
		const speakers = [makeSpeaker()];
		const messages = [makeMessage()];

		const result = buildParseResult(defaultFrontMatter, messages, speakers);

		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual([]);
		expect(result.frontMatter).toBe(defaultFrontMatter);
		expect(result.slides).toHaveLength(1);
		expect(result.slides[0]).toMatchObject({
			speaker: { name: '강사', role: '진행자' },
			context: '안녕하세요',
			lineNumber: 1,
			summary: null,
			image: null,
			detail: null
		});
		expect(result.metadata.speakers).toEqual([{ name: '강사', role: '진행자' }]);
		expect(result.metadata.totalLines).toBe(1);
		expect(result.metadata.validLines).toBe(1);
	});

	it('여러 메시지 — lineNumber가 순차 증가', () => {
		const speakers = [makeSpeaker(), makeSpeaker({ id: 's2', name: '학생', role: '참여자' })];
		const messages = [
			makeMessage({ id: 'm1', speakerId: 's1', dialogue: '첫 번째' }),
			makeMessage({ id: 'm2', speakerId: 's2', dialogue: '두 번째' }),
			makeMessage({ id: 'm3', speakerId: 's1', dialogue: '세 번째' })
		];

		const result = buildParseResult(defaultFrontMatter, messages, speakers);

		expect(result.slides).toHaveLength(3);
		expect(result.slides.map((s) => s.lineNumber)).toEqual([1, 2, 3]);
		expect(result.slides[0].speaker.name).toBe('강사');
		expect(result.slides[1].speaker.name).toBe('학생');
	});

	// === 빈 메시지 배열 ===

	it('빈 메시지 배열 → isValid: false, 빈 slides', () => {
		const result = buildParseResult(defaultFrontMatter, [], [makeSpeaker()]);

		expect(result.isValid).toBe(false);
		expect(result.slides).toEqual([]);
		expect(result.metadata.speakers).toEqual([]);
		expect(result.metadata.totalLines).toBe(0);
		expect(result.metadata.validLines).toBe(0);
	});

	// === 존재하지 않는 speakerId ===

	it('매칭되지 않는 speakerId → Unknown fallback', () => {
		const speakers = [makeSpeaker({ id: 's1' })];
		const messages = [makeMessage({ speakerId: 'nonexistent' })];

		const result = buildParseResult(defaultFrontMatter, messages, speakers);

		expect(result.slides[0].speaker).toEqual({ name: 'Unknown', role: 'Unknown' });
		expect(result.metadata.speakers).toEqual([{ name: 'Unknown', role: 'Unknown' }]);
	});

	// === 메타데이터/visualHint 전달 ===

	it('metadata 객체가 복사되어 전달됨', () => {
		const meta = { chapter: '제1장', theme: '교육' };
		const messages = [makeMessage({ metadata: meta })];

		const result = buildParseResult(defaultFrontMatter, messages, [makeSpeaker()]);

		expect(result.slides[0].metadata).toEqual(meta);
		// spread copy 확인 — 원본과 참조 분리
		expect(result.slides[0].metadata).not.toBe(meta);
	});

	it('visualHint가 있으면 그대로 전달', () => {
		const messages = [makeMessage({ visualHint: '로고 표시' })];

		const result = buildParseResult(defaultFrontMatter, messages, [makeSpeaker()]);

		expect(result.slides[0].visualHint).toBe('로고 표시');
	});

	it('visualHint가 빈 문자열이면 null로 변환', () => {
		const messages = [makeMessage({ visualHint: '' })];

		const result = buildParseResult(defaultFrontMatter, messages, [makeSpeaker()]);

		expect(result.slides[0].visualHint).toBeNull();
	});

	// === 화자 중복 제거 ===

	it('같은 화자가 여러 메시지에 나와도 speakers에 1번만 포함', () => {
		const speakers = [makeSpeaker()];
		const messages = [
			makeMessage({ id: 'm1', dialogue: '첫 대사' }),
			makeMessage({ id: 'm2', dialogue: '두 번째 대사' })
		];

		const result = buildParseResult(defaultFrontMatter, messages, speakers);

		expect(result.metadata.speakers).toHaveLength(1);
		expect(result.metadata.totalLines).toBe(2);
	});
});
