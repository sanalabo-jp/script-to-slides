<script lang="ts">
  import FileUpload from '$lib/components/FileUpload.svelte';
  import ScriptPreview from '$lib/components/ScriptPreview.svelte';
  import TemplateSelector from '$lib/components/TemplateSelector.svelte';
  import { parseScript, readFileAsText } from '$lib/parser/scriptParser';
  import type { AppStep, ParseResult, SlideTemplate } from '$lib/types';

  let step: AppStep = $state('upload');
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
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
    fileName = '';
    parseResult = null;
    selectedTemplate = null;
    errorMsg = '';
    isLoading = false;
  }
</script>

<div class="space-y-6">
  <!-- Step indicator -->
  <div class="flex items-center justify-center gap-2 text-sm">
    {#each ['Script', 'Template', 'Generate'] as label, i}
      {@const stepMap = { upload: 0, preview: 0, template: 1, analyzing: 2, ready: 2, generating: 2, done: 2, error: 0 }}
      {@const currentIndex = stepMap[step] ?? 0}
      {@const isActive = i <= currentIndex}
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
          {isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}">
          {i + 1}
        </div>
        <span class="{isActive ? 'text-gray-800 font-medium' : 'text-gray-400'}">{label}</span>
      </div>
      {#if i < 2}
        <div class="w-8 h-px {isActive ? 'bg-blue-300' : 'bg-gray-200'}"></div>
      {/if}
    {/each}
  </div>

  <!-- Error banner -->
  {#if errorMsg}
    <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
      <span class="text-red-500 mt-0.5">⚠️</span>
      <p class="text-sm text-red-700">{errorMsg}</p>
    </div>
  {/if}

  <!-- Step 1: Upload -->
  {#if step === 'upload'}
    <FileUpload onFileSelected={handleFileSelected} />
  {/if}

  <!-- Step 1: Preview -->
  {#if step === 'preview' && parseResult}
    <ScriptPreview {parseResult} />

    {#if parseResult.isValid}
      <div class="flex items-center justify-between">
        <button
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          onclick={handleReset}
        >
          ← Upload another file
        </button>
        <button
          class="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          onclick={handleProceedToTemplate}
        >
          Select Template →
        </button>
      </div>
    {:else}
      <button
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        onclick={handleReset}
      >
        ← Upload another file
      </button>
    {/if}
  {/if}

  <!-- Step 2: Template Selection -->
  {#if step === 'template'}
    <TemplateSelector {selectedTemplate} onSelect={handleTemplateSelect} />

    <!-- Format selector -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <p class="text-sm font-medium text-gray-600 mb-2">Output Format</p>
      <div class="flex gap-3">
        <label class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
          {outputFormat === 'pptx' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
          <input type="radio" name="format" value="pptx" bind:group={outputFormat} class="accent-blue-600" />
          <span class="text-sm">.pptx (PowerPoint)</span>
        </label>
        <label class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors opacity-50
          {outputFormat === 'pdf' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}">
          <input type="radio" name="format" value="pdf" bind:group={outputFormat} class="accent-blue-600" disabled />
          <span class="text-sm">.pdf (Coming soon)</span>
        </label>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <button
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        onclick={() => { step = 'preview'; }}
      >
        ← Back to preview
      </button>
      <button
        class="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors
          {!selectedTemplate ? 'opacity-50 cursor-not-allowed' : ''}"
        onclick={handleGenerate}
        disabled={!selectedTemplate}
      >
        Generate Presentation
      </button>
    </div>
  {/if}

  <!-- Generating step -->
  {#if step === 'generating'}
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="animate-spin text-4xl mb-4">🎨</div>
      <p class="text-lg font-medium text-gray-700">Generating your presentation...</p>
      <p class="text-sm text-gray-500 mt-2">Building slides with your selected template</p>
    </div>
  {/if}

  <!-- Done step -->
  {#if step === 'done'}
    <div class="bg-white rounded-xl border border-green-200 p-12 text-center">
      <div class="text-5xl mb-4">✅</div>
      <p class="text-lg font-medium text-gray-800">Presentation downloaded!</p>
      <p class="text-sm text-gray-500 mt-2 mb-6">Check your downloads folder for the .pptx file</p>
      <button
        class="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        onclick={handleReset}
      >
        Create another presentation
      </button>
    </div>
  {/if}
</div>
