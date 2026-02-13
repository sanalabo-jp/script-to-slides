<script lang="ts">
	import type { SlideTemplate } from '$lib/types';
	import { parsePptxTemplate } from '$lib/parser/pptxTemplateParser';
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

	let isDragging = $state(false);
	let isLoading = $state(false);
	let errorMsg = $state('');
	let extractedTemplate: SlideTemplate | null = $state(null);

	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function isPptx(file: File): boolean {
		return file.name.toLowerCase().endsWith('.pptx');
	}

	async function handleFile(file: File) {
		errorMsg = '';
		extractedTemplate = null;

		if (!isPptx(file)) {
			errorMsg = 'Unsupported file type. Only .pptx files are accepted.';
			return;
		}

		isLoading = true;
		try {
			extractedTemplate = await parsePptxTemplate(file);
		} catch (e) {
			errorMsg = `Style extraction failed: ${e instanceof Error ? e.message : String(e)}`;
		} finally {
			isLoading = false;
		}
	}

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
		<p class="text-xs text-gray-500">Upload a .pptx file to extract its styles as a template</p>
	</div>

	<div class="p-4 space-y-4">
		<!-- Drop zone -->
		<div
			class="border border-dashed py-12 px-8 text-center transition-colors cursor-pointer
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
				<p class="text-base text-gray-700 mb-2">
					{isDragging ? 'Drop .pptx file here' : 'Drop .pptx file or click to browse'}
				</p>
				<p class="text-xs text-gray-400">.pptx (PowerPoint)</p>
			{/if}

			<input id="pptx-input" type="file" accept=".pptx" class="hidden" onchange={onInputChange} />
		</div>

		<!-- Error state -->
		{#if errorMsg}
			<div class="t-card p-4 space-y-3">
				<p class="text-xs text-red-600">[error] {errorMsg}</p>
				<p class="text-xs text-gray-500">Presets 탭에서 기본 템플릿을 선택해주세요.</p>
				<button class="t-btn text-xs" onclick={onSwitchToPresets}> [switch to presets] </button>
			</div>
		{/if}

		<!-- Extracted template card -->
		{#if extractedTemplate}
			{@const isSelected = selectedTemplate?.id === extractedTemplate.id}
			<div class="space-y-2">
				<p class="text-xs text-gray-500">Extracted template:</p>
				<button
					class="relative border p-3 transition-all text-left w-full max-w-52
						{isSelected ? 'border-gray-900 border-2' : 'border-gray-200 hover:border-gray-400'}"
					onclick={() => onSelect(extractedTemplate!)}
					onmouseenter={() => (tooltipVisible = true)}
					onmousemove={handleMouseMove}
					onmouseleave={() => (tooltipVisible = false)}
				>
					<!-- Template preview (same layout as TemplateSelector) -->
					<div
						class="w-full aspect-[4/3] mb-2 border border-gray-100 flex items-center justify-center overflow-hidden"
						style="background-color: {extractedTemplate.background.color}"
					>
						<div class="w-4/5 space-y-1.5 p-2">
							<div
								class="h-1.5 w-3/5 opacity-60"
								style="background-color: {extractedTemplate.styles.callout1Label.fontColor}"
							></div>
							<div
								class="h-2.5 w-4/5"
								style="background-color: {extractedTemplate.styles.titleLabel.fontColor}"
							></div>
							<div class="space-y-1 pt-1">
								<div
									class="h-1.5 w-full opacity-40"
									style="background-color: {extractedTemplate.styles.bodyLabel.fontColor}"
								></div>
								<div
									class="h-1.5 w-3/4 opacity-40"
									style="background-color: {extractedTemplate.styles.bodyLabel.fontColor}"
								></div>
							</div>
						</div>
					</div>

					<!-- Template info -->
					<p class="text-xs font-medium text-gray-800">{extractedTemplate.name}</p>
					<p class="text-xs text-gray-500 mt-0.5">{extractedTemplate.description}</p>

					<!-- Selection indicator -->
					{#if isSelected}
						<div class="absolute top-1.5 right-1.5 text-xs text-gray-900 font-bold">[*]</div>
					{/if}
				</button>
			</div>

			<TemplateTooltip
				template={extractedTemplate}
				visible={tooltipVisible}
				x={tooltipX}
				y={tooltipY}
			/>
		{/if}
	</div>
</div>
