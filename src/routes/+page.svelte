<script lang="ts">
  import FileUpload from '$lib/components/FileUpload.svelte';
  import ScriptPreview from '$lib/components/ScriptPreview.svelte';
  import { parseScript, readFileAsText } from '$lib/parser/scriptParser';
  import type { AppStep, ParseResult, GeminiAnalysisResult } from '$lib/types';

  let step: AppStep = $state('upload');
  let fileName = $state('');
  let parseResult: ParseResult | null = $state(null);
  let analysis: GeminiAnalysisResult | null = $state(null);
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

  async function handleAnalyze() {
    if (!parseResult) return;

    step = 'analyzing';
    isLoading = true;
    errorMsg = '';

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: parseResult.lines }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Analysis failed' }));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      analysis = await res.json();
      step = 'ready';
    } catch (err) {
      errorMsg = `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      step = 'preview';
    } finally {
      isLoading = false;
    }
  }

  async function handleGenerate() {
    if (!parseResult || !analysis) return;

    step = 'generating';
    isLoading = true;
    errorMsg = '';

    try {
      // Client-side PPTX generation (avoids Vercel serverless ESM issues)
      const { generatePptx } = await import('$lib/generator/slideGenerator');
      const pptxData = await generatePptx(parseResult, analysis);

      const blob = new Blob([pptxData], {
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
      step = 'ready';
    } finally {
      isLoading = false;
    }
  }

  function handleReset() {
    step = 'upload';
    fileName = '';
    parseResult = null;
    analysis = null;
    errorMsg = '';
    isLoading = false;
  }
</script>

<div class="space-y-6">
  <!-- Step indicator -->
  <div class="flex items-center justify-center gap-2 text-sm">
    {#each ['Upload', 'Preview', 'Analyze', 'Generate'] as label, i}
      {@const stepIndex = ['upload', 'preview', 'analyzing', 'ready', 'generating', 'done'].indexOf(step)}
      {@const isActive = i <= Math.min(stepIndex, 3)}
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
          {isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}">
          {i + 1}
        </div>
        <span class="{isActive ? 'text-gray-800 font-medium' : 'text-gray-400'}">{label}</span>
      </div>
      {#if i < 3}
        <div class="w-8 h-px {isActive ? 'bg-blue-300' : 'bg-gray-200'}"></div>
      {/if}
    {/each}
  </div>

  <!-- Error banner -->
  {#if errorMsg}
    <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
      <span class="text-red-500 mt-0.5">⚠️</span>
      <div>
        <p class="text-sm text-red-700">{errorMsg}</p>
      </div>
    </div>
  {/if}

  <!-- Upload step -->
  {#if step === 'upload'}
    <FileUpload onFileSelected={handleFileSelected} />
  {/if}

  <!-- Preview step -->
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
          onclick={handleAnalyze}
        >
          Analyze with AI →
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

  <!-- Analyzing step -->
  {#if step === 'analyzing'}
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="animate-spin text-4xl mb-4">⚙️</div>
      <p class="text-lg font-medium text-gray-700">Analyzing your script with AI...</p>
      <p class="text-sm text-gray-500 mt-2">Generating themes, visuals, and supplementary content</p>
    </div>
  {/if}

  <!-- Ready step -->
  {#if step === 'ready' && analysis && parseResult}
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-800 mb-4">Analysis Complete</h2>

      <!-- Theme preview -->
      <div class="mb-6">
        <p class="text-sm font-medium text-gray-600 mb-2">Themes by Role</p>
        <div class="flex flex-wrap gap-3">
          {#each Object.entries(analysis.themes) as [role, theme]}
            <div
              class="px-4 py-3 rounded-lg border"
              style="background-color: {theme.backgroundColor}; border-color: {theme.accentColor}"
            >
              <span style="color: {theme.primaryColor}" class="font-medium text-sm">{role}</span>
              <span style="color: {theme.accentColor}" class="text-xs ml-2">({theme.mood})</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Slide count -->
      <p class="text-sm text-gray-500 mb-6">
        {analysis.slides.length} slides will be generated
        · {analysis.slides.filter((s) => s.supplementary).length} with supplementary content
      </p>

      <!-- Format selector -->
      <div class="mb-6">
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

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <button
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          onclick={handleReset}
        >
          ← Start over
        </button>
        <button
          class="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          onclick={handleGenerate}
        >
          Generate Presentation 🎉
        </button>
      </div>
    </div>
  {/if}

  <!-- Generating step -->
  {#if step === 'generating'}
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div class="animate-spin text-4xl mb-4">🎨</div>
      <p class="text-lg font-medium text-gray-700">Generating your presentation...</p>
      <p class="text-sm text-gray-500 mt-2">Building slides with themes and visuals</p>
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
