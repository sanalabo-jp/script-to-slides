<script lang="ts">
	import FileUpload from '$lib/components/FileUpload.svelte';
	import ManualInputMode from '$lib/components/ManualInputMode.svelte';
	import ScriptPreview from '$lib/components/ScriptPreview.svelte';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';
	import CustomTemplateTab from '$lib/components/CustomTemplateTab.svelte';
	import { parseScript, readFileAsText } from '$lib/parser/scriptParser';
	import type { AppStep, ParseResult, SlideTemplate } from '$lib/types';

	let step: AppStep = $state('upload');
	let inputMode: 'file' | 'manual' = $state('file');
	let templateTab: 'presets' | 'custom' = $state('presets');
	let fileName = $state('');
	let parseResult: ParseResult | null = $state(null);
	let selectedTemplate: SlideTemplate | null = $state(null);
	let outputFormat: 'pptx' | 'pdf' = $state('pptx');
	let errorMsg = $state('');
	let isLoading = $state(false);

	async function handleFileSelected(file: File) {
		try {
			fileName = file.name;
			errorMsg = '';

			const content = await readFileAsText(file);
			const result = parseScript(content);
			parseResult = result;

			if (!result.isValid) {
				errorMsg = 'The file does not appear to be a valid script. Please check the format.';
				step = 'preview';
				return;
			}

			step = 'preview';
		} catch (err) {
			errorMsg = `Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`;
			step = 'error';
		}
	}

	function handleManualComplete(result: ParseResult) {
		parseResult = result;
		errorMsg = '';
		step = 'preview';
	}

	function handleTemplateSelect(template: SlideTemplate) {
		selectedTemplate = template;
	}

	function handleProceedToTemplate() {
		step = 'template';
	}

	async function handleGenerate() {
		if (!parseResult || !selectedTemplate) return;

		step = 'generating';
		isLoading = true;
		errorMsg = '';

		try {
			const { generatePptx } = await import('$lib/generator/slideGenerator');
			const pptxData = await generatePptx(parseResult, selectedTemplate);

			const blob = new Blob([pptxData.buffer as ArrayBuffer], {
				type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'presentation.pptx';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			step = 'done';
		} catch (err) {
			errorMsg = `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
			step = 'template';
		} finally {
			isLoading = false;
		}
	}

	function handleReset() {
		step = 'upload';
		inputMode = 'file';
		fileName = '';
		parseResult = null;
		selectedTemplate = null;
		errorMsg = '';
		isLoading = false;
	}
</script>

<div class="space-y-4">
	<!-- Step indicator -->
	<div class="flex items-center gap-1.5 text-xs">
		{#each ['Upload', 'Preview', 'Template', 'Generate'] as label, i}
			{@const stepMap = {
				upload: 0,
				preview: 1,
				template: 2,
				analyzing: 3,
				ready: 3,
				generating: 3,
				done: 3,
				error: 0
			}}
			{@const currentIndex = stepMap[step] ?? 0}
			{@const isActive = i <= currentIndex}
			<span class={isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'}
				>[{i + 1}] {label}</span
			>
			{#if i < 3}
				<span class="text-gray-300">&mdash;</span>
			{/if}
		{/each}
	</div>

	<!-- Error banner -->
	{#if errorMsg}
		<div class="border-l-2 border-red-400 bg-white px-4 py-3">
			<p class="text-xs text-red-700"><span class="text-red-500">[error]</span> {errorMsg}</p>
		</div>
	{/if}

	<!-- Step 1: Upload -->
	{#if step === 'upload'}
		<!-- Input mode tabs -->
		<div class="flex gap-0">
			<button
				class="input-tab {inputMode === 'file' ? 'input-tab-active' : ''}"
				onclick={() => {
					inputMode = 'file';
				}}>File</button
			>
			<button
				class="input-tab {inputMode === 'manual' ? 'input-tab-active' : ''}"
				onclick={() => {
					inputMode = 'manual';
				}}>Manual</button
			>
		</div>

		{#if inputMode === 'file'}
			<FileUpload onFileSelected={handleFileSelected} />
		{:else}
			<ManualInputMode onComplete={handleManualComplete} />
		{/if}
	{/if}

	<!-- Step 2: Preview -->
	{#if step === 'preview' && parseResult}
		<ScriptPreview {parseResult} />

		{#if parseResult.isValid}
			<div class="flex items-center justify-between">
				<button class="t-btn-text" onclick={handleReset}
					>[<span class="t-btn-label">&larr; re-upload</span>]</button
				>
				<button class="t-btn" onclick={handleProceedToTemplate}
					>[<span class="underline">select template &rarr;</span>]</button
				>
			</div>
		{:else}
			<button class="t-btn-text" onclick={handleReset}
				>[<span class="t-btn-label">&larr; re-upload</span>]</button
			>
		{/if}
	{/if}

	<!-- Step 3: Template Selection -->
	{#if step === 'template'}
		<!-- Template mode tabs -->
		<div class="flex gap-0">
			<button
				class="input-tab {templateTab === 'presets' ? 'input-tab-active' : ''}"
				onclick={() => {
					templateTab = 'presets';
				}}>Presets</button
			>
			<button
				class="input-tab {templateTab === 'custom' ? 'input-tab-active' : ''}"
				onclick={() => {
					templateTab = 'custom';
				}}>Custom</button
			>
		</div>

		<div class:hidden={templateTab !== 'presets'}>
			<TemplateSelector {selectedTemplate} onSelect={handleTemplateSelect} />
		</div>
		<div class:hidden={templateTab !== 'custom'}>
			<CustomTemplateTab
				{selectedTemplate}
				onSelect={handleTemplateSelect}
				onSwitchToPresets={() => {
					templateTab = 'presets';
				}}
			/>
		</div>

		<!-- Format selector -->
		<div class="t-card p-4">
			<h3 class="text-base font-semibold text-gray-800 mb-3">Output Format</h3>
			<div class="flex gap-3">
				<label
					class="flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-colors
          {outputFormat === 'pptx'
						? 'border-gray-900 bg-gray-50'
						: 'border-gray-200 hover:border-gray-300'}"
				>
					<input
						type="radio"
						name="format"
						value="pptx"
						bind:group={outputFormat}
						class="accent-gray-900"
					/>
					<span>.pptx (PowerPoint)</span>
				</label>
				<label
					class="flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-colors opacity-40
          {outputFormat === 'pdf' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}"
				>
					<input
						type="radio"
						name="format"
						value="pdf"
						bind:group={outputFormat}
						class="accent-gray-900"
						disabled
					/>
					<span>.pdf (Coming soon)</span>
				</label>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<button
				class="t-btn-text"
				onclick={() => {
					step = 'preview';
				}}
			>
				[<span class="t-btn-label">&larr; back to preview</span>]
			</button>
			<button
				class="t-btn {!selectedTemplate ? 'opacity-40 cursor-not-allowed' : ''}"
				onclick={handleGenerate}
				disabled={!selectedTemplate}
			>
				[<span class="underline">generate presentation</span>]
			</button>
		</div>
	{/if}

	<!-- Step 4: Generating -->
	{#if step === 'generating'}
		<div class="t-card p-8 text-center">
			<p class="text-base font-semibold text-gray-800 mb-1">
				Generating presentation<span class="animate-blink">...</span>
			</p>
			<p class="text-xs text-gray-500">Building slides with the selected template</p>
		</div>
	{/if}

	<!-- Step 4: Done -->
	{#if step === 'done'}
		<div class="t-card p-8 text-center">
			<p class="text-base font-semibold text-gray-800 mb-1">[done] Presentation downloaded.</p>
			<p class="text-xs text-gray-500">Check your downloads folder for the .pptx file</p>
			<button class="t-btn mt-4" onclick={handleReset}
				>[<span class="underline">create another presentation</span>]</button
			>
		</div>
	{/if}
</div>
