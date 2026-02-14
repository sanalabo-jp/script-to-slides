<script lang="ts">
	import type { SlideTemplate } from '$lib/types';
	import { parsePptxTemplate } from '$lib/parser/pptxTemplateParser';
	import { createBlankCustomTemplate, resolveUniqueName } from '$lib/templates/templateUtils';
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

	// --- Custom templates list ---
	let customTemplates: SlideTemplate[] = $state([]);

	// --- Extract/drop state ---
	let isDragging = $state(false);
	let isLoading = $state(false);
	let errorMsg = $state('');
	let extractWarnings: string[] = $state([]);

	// --- Editor state ---
	type EditorMode = 'none' | 'new-extract' | 'new-scratch' | 'edit';
	let editorMode: EditorMode = $state('none');
	let editingIndex = $state(-1);
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
		closeEditor();

		if (!isPptx(file)) {
			errorMsg = 'Unsupported file type. Only .pptx files are accepted.';
			return;
		}

		isLoading = true;
		try {
			const result = await parsePptxTemplate(file);
			extractWarnings = result.warnings;
			openNewEditor('new-extract', result.template);
		} catch (e) {
			errorMsg = `Style extraction failed: ${e instanceof Error ? e.message : String(e)}`;
		} finally {
			isLoading = false;
		}
	}

	function openNewEditor(mode: 'new-extract' | 'new-scratch', template: SlideTemplate) {
		editorMode = mode;
		editingIndex = -1;
		const plain = $state.snapshot(template);
		editorTemplate = structuredClone(plain);
		previewTemplate = structuredClone(plain);
	}

	function openEditEditor(index: number) {
		editorMode = 'edit';
		editingIndex = index;
		const plain = $state.snapshot(customTemplates[index]);
		editorTemplate = structuredClone(plain);
		previewTemplate = structuredClone(plain);
	}

	function closeEditor() {
		editorMode = 'none';
		editingIndex = -1;
		editorTemplate = null;
		previewTemplate = null;
	}

	function handleEditorChange(updated: SlideTemplate) {
		previewTemplate = updated;
	}

	function handleAddOrUpdateTemplate() {
		if (!previewTemplate) return;
		const plain = $state.snapshot(previewTemplate);

		if (editorMode === 'edit' && editingIndex >= 0) {
			// Update existing template — resolve name if changed to a duplicate
			const otherNames = customTemplates
				.filter((_, idx) => idx !== editingIndex)
				.map((t) => t.name);
			const updated = structuredClone(plain);
			updated.name = resolveUniqueName(updated.name, otherNames);
			customTemplates[editingIndex] = updated;
			if (selectedTemplate?.id === plain.id) {
				onSelect(updated);
			}
		} else {
			// Add new template to the list
			const existingNames = customTemplates.map((t) => t.name);
			const newTemplate = structuredClone(plain);
			newTemplate.name = resolveUniqueName(newTemplate.name, existingNames);
			customTemplates.push(newTemplate);
			// Auto-select newly added template
			onSelect(newTemplate);
		}
		closeEditor();
	}

	function handleDeleteTemplate(index: number) {
		const deletedId = customTemplates[index].id;
		customTemplates.splice(index, 1);

		// If deleted template was selected, select first remaining
		if (selectedTemplate?.id === deletedId && customTemplates.length > 0) {
			onSelect($state.snapshot(customTemplates[0]));
		}
	}

	function handleCreateScratch() {
		const blank = createBlankCustomTemplate();
		openNewEditor('new-scratch', blank);
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
		<!-- ═══ Section 1: Your Templates (radio group) ═══ -->
		{#if customTemplates.length > 0}
			<div class="space-y-3">
				<p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Your Templates</p>
				<div class="grid grid-cols-3 gap-3">
					{#each customTemplates as template, i}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							onmouseenter={() => {
								tooltipTemplate = template;
								tooltipVisible = true;
							}}
							onmousemove={handleMouseMove}
							onmouseleave={() => {
								tooltipVisible = false;
								tooltipTemplate = null;
							}}
						>
							<TemplatePreviewCard
								{template}
								isSelected={selectedTemplate?.id === template.id}
								onClick={() => onSelect(template)}
							/>
							<div class="flex gap-1 mt-1 justify-end items-center">
								<button
									class="text-xs text-red-400 hover:text-red-600 cursor-pointer"
									onclick={() => handleDeleteTemplate(i)}
								>
									[del]
								</button>
								<span class="text-xs text-gray-300">/</span>
								<button
									class="text-xs text-gray-500 hover:text-gray-900 font-bold cursor-pointer"
									onclick={() => openEditEditor(i)}
								>
									[edit]
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ═══ Section 2: Add New (drop zone + create button) ═══ -->
		{#if editorMode === 'none'}
			<div class="space-y-3 {customTemplates.length > 0 ? 'border-t border-gray-100 pt-4' : ''}">
				<p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
					{customTemplates.length > 0 ? 'Add New' : 'Create Template'}
				</p>

				<!-- Drop zone -->
				<div
					class="border border-dashed py-12 px-4 text-center transition-colors cursor-pointer
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
							{isDragging ? 'Drop .pptx file here' : 'Drop .pptx or click to extract styles'}
						</p>
						<p class="text-xs text-gray-400">.pptx (PowerPoint)</p>
					{/if}
					<input
						id="pptx-input"
						type="file"
						accept=".pptx"
						class="hidden"
						onchange={onInputChange}
					/>
				</div>

				<!-- Error state -->
				{#if errorMsg}
					<div class="t-card p-3 space-y-2">
						<p class="text-xs text-red-600">[error] {errorMsg}</p>
						<div class="flex gap-2">
							<button class="t-btn text-xs" onclick={onSwitchToPresets}>[switch to presets]</button>
							<button class="t-btn text-xs" onclick={handleCreateScratch}
								>[build from scratch]</button
							>
						</div>
					</div>
				{/if}

				<!-- Build from scratch -->
				<button class="t-btn text-xs" onclick={handleCreateScratch}> [create new template] </button>
			</div>
		{/if}

		<!-- ═══ Section 3: Editor ═══ -->
		{#if editorMode !== 'none' && editorTemplate}
			<div class="border-t border-gray-100 pt-4 space-y-3">
				<p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
					{editorMode === 'edit'
						? 'Edit Template'
						: editorMode === 'new-extract'
							? 'Extracted Template'
							: 'New Template'}
				</p>

				<!-- Warnings from partial extraction -->
				{#if extractWarnings.length > 0 && editorMode === 'new-extract'}
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
					<button
						class="t-btn text-xs disabled:opacity-50 disabled:cursor-not-allowed"
						onclick={handleAddOrUpdateTemplate}
						disabled={!previewTemplate?.name?.trim()}
					>
						[<span class="underline"
							>{editorMode === 'edit' ? 'update template' : 'add this template'}</span
						>]
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if tooltipTemplate}
	<TemplateTooltip template={tooltipTemplate} visible={tooltipVisible} x={tooltipX} y={tooltipY} />
{/if}
