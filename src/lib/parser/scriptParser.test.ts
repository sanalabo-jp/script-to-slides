import { describe, it, expect } from 'vitest';
import { parseScript, isSupportedExtension } from './scriptParser';
import { ScriptType } from '$lib/types';

describe('isSupportedExtension', () => {
	it('.txt 확장자를 지원한다', () => {
		expect(isSupportedExtension('test.txt')).toBe(true);
	});

	it('.md 확장자를 지원한다', () => {
		expect(isSupportedExtension('test.md')).toBe(true);
	});

	it('지원하지 않는 확장자를 거부한다', () => {
		expect(isSupportedExtension('test.pdf')).toBe(false);
		expect(isSupportedExtension('test.docx')).toBe(false);
	});
});

describe('parseScript', () => {
	it('프론트매터를 올바르게 파싱한다', () => {
		const input = `-type: 4
-topic: 인공지능의 미래
-categories: AI, 기술트렌드, 패널토론

---

김교수[진행자]: 안녕하세요.`;

		const result = parseScript(input);
		expect(result.frontMatter.type).toBe(ScriptType.Interview);
		expect(result.frontMatter.topic).toBe('인공지능의 미래');
		expect(result.frontMatter.categories).toEqual(['AI', '기술트렌드', '패널토론']);
	});

	it('대사 라인을 올바르게 파싱한다', () => {
		const input = `---

김교수[진행자]: 안녕하세요.
이수진[패널]: 네, 반갑습니다.`;

		const result = parseScript(input);
		expect(result.slides).toHaveLength(2);
		expect(result.slides[0].speaker.name).toBe('김교수');
		expect(result.slides[0].speaker.role).toBe('진행자');
		expect(result.slides[0].context).toBe('안녕하세요.');
		expect(result.slides[1].speaker.name).toBe('이수진');
	});

	it('시각 힌트(description)를 파싱한다', () => {
		const input = `---

강사[진행자]: (슬라이드 표시) AI의 정의를 살펴봅시다.`;

		const result = parseScript(input);
		expect(result.slides[0].visualHint).toBe('슬라이드 표시');
		expect(result.slides[0].context).toBe('AI의 정의를 살펴봅시다.');
	});

	it('행 메타데이터를 대사에 연결한다', () => {
		const input = `---

--chapter: 도입
--note: 프로그램 시작
김교수[진행자]: 안녕하세요.`;

		const result = parseScript(input);
		expect(result.slides[0].metadata).toEqual({
			chapter: '도입',
			note: '프로그램 시작'
		});
	});

	it('프론트매터 없는 대본을 처리한다', () => {
		const input = `김교수[진행자]: 안녕하세요.
이수진[패널]: 반갑습니다.`;

		const result = parseScript(input);
		expect(result.frontMatter.type).toBe(ScriptType.General);
		expect(result.slides).toHaveLength(2);
		expect(result.isValid).toBe(true);
	});

	it('빈 입력에 대해 유효하지 않음을 반환한다', () => {
		const result = parseScript('');
		expect(result.slides).toHaveLength(0);
		expect(result.isValid).toBe(false);
	});

	it('화자 목록을 정확하게 추출한다', () => {
		const input = `---

김교수[진행자]: 첫 번째 대사.
이수진[패널]: 두 번째 대사.
김교수[진행자]: 세 번째 대사.`;

		const result = parseScript(input);
		expect(result.metadata.speakers).toHaveLength(2);
		expect(result.metadata.speakers[0]).toEqual({ name: '김교수', role: '진행자' });
		expect(result.metadata.speakers[1]).toEqual({ name: '이수진', role: '패널' });
	});
});
