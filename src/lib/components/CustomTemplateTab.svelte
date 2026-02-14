<script lang="ts">
	import type { SlideTemplate } from '$lib/types';
	import { parsePptxTemplate } from '$lib/parser/pptxTemplateParser';
	import { createBlankCustomTemplate } from '$lib/templates/templateUtils';
	import TemplatePreviewCard from './TemplatePreviewCard.svelte';
	import TemplateEditor from './TemplateEditor.svelte';
	import TemplateTooltip from './TemplateTooltip.svelte';

	let {
		selectedTemplate,
		onSelect,
		onSwitchToPresets
	}: {
		selectedTemplate: SlideTemplate | null;
		onSelect: (template: SlideTemplate) => void;
		onSwitchToPresets: () => void;
	} = $props();

	// --- Extract state ---
	let isDragging = $state(false);
	let isLoading = $state(false);
	let errorMsg = $state('');
	let extractWarnings: string[] = $state([]);
	let extractedTemplate: SlideTemplate | null = $state(null);

	// --- Editor state ---
	type EditorMode = 'none' | 'extract-edit' | 'scratch';
	let editorMode: EditorMode = $state('none');
	let editorTemplate: SlideTemplate | null = $state(null);
	let previewTemplate: SlideTemplate | null = $state(null);

	// --- Tooltip state ---
	let tooltipTemplate: SlideTemplate | null = $state(null);
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function isPptx(file: File): boolean {
		return file.name.toLowerCase().endsWith('.pptx');
	}

	async function handleFile(file: File) {
		errorMsg = '';
		extractWarnings = [];
		extractedTemplate = null;
		closeEditor();

		if (!isPptx(file)) {
			errorMsg = 'Unsupported file type. Only .pptx files are accepted.';
			return;
		}

		isLoading = true;
		try {
			const result = await parsePptxTemplate(file);
			extractedTemplate = result.template;
			extractWarnings = result.warnings;

			if (result.isPartial) {
				// Partial extraction → open editor automatically
				openEditor('extract-edit', result.template);
			}
		} catch (e) {
			errorMsg = `Style extraction failed: ${e instanceof Error ? e.message : String(e)}`;
		} finally {
			isLoading = false;
		}
	}

	function openEditor(mode: EditorMode, template: SlideTemplate) {
		editorMode = mode;
		const plain = $state.snapshot(template);
		editorTemplate = structuredClone(plain);
		previewTemplate = structuredClone(plain);
	}

	function closeEditor() {
		editorMode = 'none';
		editorTemplate = null;
		previewTemplate = null;
	}

	function handleEditorChange(updated: SlideTemplate) {
		previewTemplate = updated;
	}

	function handleUseTemplate() {
		if (previewTemplate) {
			onSelect(previewTemplate);
			closeEditor();
		}
	}

	function handleCreateScratch() {
		const blank = createBlankCustomTemplate();
		openEditor('scratch', blank);
	}

	function handleEditExtracted() {
		if (extractedTemplate) {
			openEditor('extract-edit', extractedTemplate);
		}
	}

	// --- Drop zone handlers ---
	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) handleFile(file);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function onDragLeave() {
		isDragging = false;
	}

	function onInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) handleFile(file);
		input.value = '';
	}

	function handleMouseMove(e: MouseEvent) {
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}
</script>

<div class="t-card overflow-hidden">
	<div class="px-4 py-3 border-b border-gray-200">
		<h2 class="text-base font-semibold text-gray-800 mb-1">Custom Template</h2>
		<p class="text-xs text-gray-500">Extract from .pptx or build from scratch</p>
	</div>

	<div class="p-4 space-y-6">
		<!-- ═══ Section 1: Extract from .pptx ═══ -->
		<div class="space-y-3">
			<p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Extract from .pptx</p>

			<!-- Drop zone -->
			<div
				class="border border-dashed py-8 px-6 text-center transition-colors cursor-pointer
					{isDragging ? 'border-gray-500 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-400'}"
				role="button"
				tabindex="0"
				ondrop={onDrop}
				ondragover={onDragOver}
				ondragleave={onDragLeave}
				onclick={() => document.getElementById('pptx-input')?.click()}
				onkeydown={(e) => {
					if (e.key === 'Enter') document.getElementById('pptx-input')?.click();
				}}
			>
				{#if isLoading}
					<p class="text-sm text-gray-500">
						<span class="animate-blink">_</span> extracting styles...
					</p>
				{:else}
					<p class="text-sm text-gray-700 mb-1">
						{isDragging ? 'Drop .pptx file here' : 'Drop .pptx file or click to browse'}
					</p>
					<p class="text-xs text-gray-400">.pptx (PowerPoint)</p>
				{/if}
				<input id="pptx-input" type="file" accept=".pptx" class="hidden" onchange={onInputChange} />
			</div>

			<!-- Error state -->
			{#if errorMsg}
				<div class="t-card p-3 space-y-2">
					<p class="text-xs text-red-600">[error] {errorMsg}</p>
					<div class="flex gap-2">
						<button class="t-btn text-xs" onclick={onSwitchToPresets}>[switch to presets]</button>
						<button class="t-btn text-xs" onclick={handleCreateScratch}>[build from scratch]</button
						>
					</div>
				</div>
			{/if}

			<!-- Extracted template card -->
			{#if extractedTemplate && editorMode !== 'extract-edit'}
				{@const isSelected = selectedTemplate?.id === extractedTemplate.id}
				<div class="space-y-2">
					<p class="text-xs text-gray-500">Extracted template:</p>
					<div class="flex items-end gap-3">
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="max-w-44"
							onmouseenter={() => {
								tooltipTemplate = extractedTemplate;
								tooltipVisible = true;
							}}
							onmousemove={handleMouseMove}
							onmouseleave={() => {
								tooltipVisible = false;
								tooltipTemplate = null;
							}}
						>
							<TemplatePreviewCard
								template={extractedTemplate}
								{isSelected}
								onClick={() => onSelect(extractedTemplate!)}
								class="w-full"
							/>
						</div>
						<div class="flex flex-col gap-1.5 pb-1">
							<button
								class="text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
								onclick={handleEditExtracted}
							>
								[edit]
							</button>
							<button
								class="text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
								onclick={() => onSelect(extractedTemplate!)}
							>
								[use as-is]
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- ═══ Section 2: Build from scratch ═══ -->
		{#if editorMode === 'none'}
			<div class="space-y-3 border-t border-gray-100 pt-4">
				<p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
					Build from scratch
				</p>
				<button class="t-btn text-xs" onclick={handleCreateScratch}> [create new template] </button>
			</div>
		{/if}

		<!-- ═══ Section 3: Editor ═══ -->
		{#if editorMode !== 'none' && editorTemplate}
			<div class="border-t border-gray-100 pt-4 space-y-3">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
						{editorMode === 'extract-edit' ? 'Edit Extracted' : 'New Template'}
					</p>
					<button
						class="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
						onclick={closeEditor}
					>
						[cancel]
					</button>
				</div>

				<!-- Warnings from partial extraction -->
				{#if extractWarnings.length > 0 && editorMode === 'extract-edit'}
					<div class="border-l-2 border-yellow-400 bg-yellow-50 px-3 py-2 space-y-1">
						<p class="text-[10px] text-yellow-700 font-semibold uppercase">Partial extraction</p>
						{#each extractWarnings as warning}
							<p class="text-[10px] text-yellow-600">- {warning}</p>
						{/each}
						<p class="text-[10px] text-yellow-600">Review and adjust the values below.</p>
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
					<!-- Preview card (live) -->
					{#if previewTemplate}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="self-start"
							onmouseenter={() => {
								tooltipTemplate = previewTemplate;
								tooltipVisible = true;
							}}
							onmousemove={handleMouseMove}
							onmouseleave={() => {
								tooltipVisible = false;
								tooltipTemplate = null;
							}}
						>
							<TemplatePreviewCard
								template={previewTemplate}
								isSelected={selectedTemplate?.id === previewTemplate.id}
							/>
						</div>
					{/if}

					<!-- Editor form -->
					<div class="min-w-0">
						<TemplateEditor initialTemplate={editorTemplate} onChange={handleEditorChange} />
					</div>
				</div>

				<!-- Action buttons -->
				<div class="flex justify-end gap-2 pt-2">
					<button class="t-btn-text text-xs" onclick={closeEditor}>
						[<span class="t-btn-label">cancel</span>]
					</button>
					<button class="t-btn text-xs" onclick={handleUseTemplate}>
						[<span class="underline">use this template</span>]
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if tooltipTemplate}
	<TemplateTooltip template={tooltipTemplate} visible={tooltipVisible} x={tooltipX} y={tooltipY} />
{/if}
