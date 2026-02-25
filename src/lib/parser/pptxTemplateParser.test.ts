// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { parsePptxTemplate } from './pptxTemplateParser';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { findElement } from '$lib/templates/templateUtils';

/**
 * jsdom의 File은 arrayBuffer()를 미구현하므로, polyfill을 추가한 File을 생성한다.
 */
function loadPptxAsFile(relativePath: string): File {
	const absPath = resolve(relativePath);
	const buffer = readFileSync(absPath);
	const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	const name = absPath.split('/').pop()!;
	const file = new File([uint8], name, {
		type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
	});

	// jsdom File.arrayBuffer() polyfill
	if (!file.arrayBuffer) {
		file.arrayBuffer = () =>
			new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as ArrayBuffer);
				reader.readAsArrayBuffer(file);
			});
	}

	return file;
}

describe('parsePptxTemplate (통합)', () => {
	it('clean-minimal.pptx → 유효한 PptxParseResult를 반환한다', async () => {
		const file = loadPptxAsFile('sample/templates/clean-minimal.pptx');
		const result = await parsePptxTemplate(file);

		expect(result.template.id).toMatch(/^custom-/);
		expect(result.template.name).toBe('clean-minimal');
		expect(result.template.description).toContain('.pptx');
		expect(result.template.background.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		expect(Array.isArray(result.warnings)).toBe(true);
		expect(typeof result.isPartial).toBe('boolean');

		// 6개 elements 존재
		expect(result.template.elements).toHaveLength(6);
		for (const name of ['callout1', 'callout2', 'title', 'body', 'image', 'caption'] as const) {
			const el = findElement(result.template.elements, name);
			expect(el).toBeDefined();
			if (name !== 'image') {
				expect(el!.styles.length).toBeGreaterThanOrEqual(1);
				expect(el!.styles[0].fontFamily).toBeTruthy();
				expect(el!.styles[0].fontSize).toBeGreaterThan(0);
				expect(el!.styles[0].fontColor).toMatch(/^#/);
				expect(typeof el!.styles[0].fontWeight).toBe('number');
			}
		}
	});

	it('modern-dark.pptx → 유효한 템플릿과 배경색을 추출한다', async () => {
		const file = loadPptxAsFile('sample/templates/modern-dark.pptx');
		const result = await parsePptxTemplate(file);

		expect(result.template.name).toBe('modern-dark');
		expect(result.template.background.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		const titleEl = findElement(result.template.elements, 'title');
		expect(titleEl!.styles[0].fontFamily).toBeTruthy();
	});

	it('dark-minimalist.pptx → 유효한 SlideTemplate을 반환한다', async () => {
		const file = loadPptxAsFile('sample/templates/dark-minimalist.pptx');
		const result = await parsePptxTemplate(file);

		expect(result.template.name).toBe('dark-minimalist');
		const titleEl = findElement(result.template.elements, 'title');
		const bodyEl = findElement(result.template.elements, 'body');
		expect(titleEl!.styles[0].fontSize).toBeGreaterThanOrEqual(bodyEl!.styles[0].fontSize);
	});

	it('callout2에 primary + secondary 듀얼 스타일이 있다', async () => {
		const file = loadPptxAsFile('sample/templates/clean-minimal.pptx');
		const result = await parsePptxTemplate(file);

		const callout2 = findElement(result.template.elements, 'callout2')!;
		expect(callout2.styles).toHaveLength(2);
		expect(callout2.styles[0].fontWeight).toBe(700); // primary: bold (name)
		// secondary: derived (role) — lighter color
		expect(callout2.styles[1].fontColor).not.toBe(callout2.styles[0].fontColor);
	});

	it('잘못된 파일은 에러를 throw한다 (JSZip 실패)', async () => {
		const fakeFile = new File([new Uint8Array([0, 1, 2, 3])], 'not-a-pptx.pptx', {
			type: 'application/octet-stream'
		});
		await expect(parsePptxTemplate(fakeFile)).rejects.toThrow();
	});

	it('추출된 layout의 position/size가 유효 범위 내에 있다', async () => {
		const file = loadPptxAsFile('sample/templates/clean-minimal.pptx');
		const result = await parsePptxTemplate(file);

		for (const el of result.template.elements) {
			// position: 0 이상, 슬라이드 영역 내 (widescreen 13.33" × 7.5")
			expect(el.layout.position.x).toBeGreaterThanOrEqual(0);
			expect(el.layout.position.y).toBeGreaterThanOrEqual(0);
			expect(el.layout.position.x).toBeLessThanOrEqual(13.34);
			expect(el.layout.position.y).toBeLessThanOrEqual(7.5);

			// size: 양수
			expect(el.layout.size.w).toBeGreaterThan(0);
			expect(el.layout.size.h).toBeGreaterThan(0);

			// zIndex: 양의 정수
			expect(el.layout.zIndex).toBeGreaterThan(0);
		}
	});

	it('callout2와 image는 항상 LECTURE_LAYOUT 폴백 위치를 사용한다', async () => {
		const file = loadPptxAsFile('sample/templates/clean-minimal.pptx');
		const result = await parsePptxTemplate(file);

		const callout2 = findElement(result.template.elements, 'callout2')!;
		expect(callout2.layout.position).toEqual({ x: 0.8, y: 0.7 });
		expect(callout2.layout.size).toEqual({ w: 11.7, h: 0.35 });

		const image = findElement(result.template.elements, 'image')!;
		expect(image.layout.position).toEqual({ x: 8.2, y: 2.1 });
		expect(image.layout.size).toEqual({ w: 4.33, h: 3.25 });
	});
});
