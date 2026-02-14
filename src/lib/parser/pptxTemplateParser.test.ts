// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { parsePptxTemplate } from './pptxTemplateParser';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

		// 모든 스타일 키가 존재
		const { styles } = result.template;
		for (const key of [
			'titleLabel',
			'bodyLabel',
			'callout1Label',
			'callout2Label',
			'captionLabel'
		] as const) {
			expect(styles[key]).toBeDefined();
			expect(styles[key].fontFamily).toBeTruthy();
			expect(styles[key].fontSize).toBeGreaterThan(0);
			expect(styles[key].fontColor).toMatch(/^#/);
			expect(typeof styles[key].fontWeight).toBe('number');
		}
	});

	it('modern-dark.pptx → 유효한 템플릿과 배경색을 추출한다', async () => {
		const file = loadPptxAsFile('sample/templates/modern-dark.pptx');
		const result = await parsePptxTemplate(file);

		expect(result.template.name).toBe('modern-dark');
		expect(result.template.background.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		expect(result.template.styles.titleLabel.fontFamily).toBeTruthy();
	});

	it('dark-minimalist.pptx → 유효한 SlideTemplate을 반환한다', async () => {
		const file = loadPptxAsFile('sample/templates/dark-minimalist.pptx');
		const result = await parsePptxTemplate(file);

		expect(result.template.name).toBe('dark-minimalist');
		expect(result.template.styles.titleLabel.fontSize).toBeGreaterThanOrEqual(
			result.template.styles.bodyLabel.fontSize
		);
	});

	it('callout2Label은 항상 callout1에서 파생된다', async () => {
		const file = loadPptxAsFile('sample/templates/clean-minimal.pptx');
		const result = await parsePptxTemplate(file);

		const { callout1Label, callout2Label } = result.template.styles;
		expect(callout2Label.fontFamily).toBe(callout1Label.fontFamily);
		expect(callout2Label.fontSize).toBeLessThan(callout1Label.fontSize);
		expect(callout2Label.fontWeight).toBe(callout1Label.fontWeight);
	});

	it('잘못된 파일은 에러를 throw한다 (JSZip 실패)', async () => {
		const fakeFile = new File([new Uint8Array([0, 1, 2, 3])], 'not-a-pptx.pptx', {
			type: 'application/octet-stream'
		});
		await expect(parsePptxTemplate(fakeFile)).rejects.toThrow();
	});
});
