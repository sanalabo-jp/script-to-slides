<script lang="ts">
  import { isSuportedExtension } from '$lib/parser/scriptParser';

  let {
    onFileSelected,
  }: {
    onFileSelected: (file: File) => void;
  } = $props();

  let isDragging = $state(false);
  let errorMsg = $state('');
  let guideOpen = $state(true);

  function handleFile(file: File) {
    errorMsg = '';

    if (!isSuportedExtension(file.name)) {
      errorMsg = `Unsupported file type. Accepted: .txt, .md, .text, .script`;
      return;
    }

    onFileSelected(file);
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
  }
</script>

<div class="space-y-4">
  <!-- Upload area -->
  <div
    class="border border-dashed p-8 text-center transition-colors cursor-pointer
      {isDragging ? 'border-gray-500 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-400'}"
    role="button"
    tabindex="0"
    ondrop={onDrop}
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    onclick={() => document.getElementById('file-input')?.click()}
    onkeydown={(e) => { if (e.key === 'Enter') document.getElementById('file-input')?.click(); }}
  >
    <p class="text-sm text-gray-700 mb-1">
      {isDragging ? 'Drop file here' : 'Drop script file or click to browse'}
    </p>
    <p class="text-xs text-gray-400">
      .txt, .md, .text, .script
    </p>

    {#if errorMsg}
      <p class="mt-3 text-xs text-red-600 font-mono">[error] {errorMsg}</p>
    {/if}

    <input
      id="file-input"
      type="file"
      accept=".txt,.md,.text,.script"
      class="hidden"
      onchange={onInputChange}
    />
  </div>

  <!-- v2 Format Guide -->
  <details class="t-card" bind:open={guideOpen}>
    <summary class="px-4 py-3 cursor-pointer text-sm font-mono text-gray-700 hover:text-gray-900 select-none">
      Script Format Guide (v2)
    </summary>
    <div class="px-4 pb-4 space-y-4 text-xs text-gray-600">

      <!-- Front Matter -->
      <div>
        <h3 class="font-mono font-semibold text-gray-800 mb-1">Front Matter</h3>
        <p class="mb-2 leading-relaxed">
          Define script metadata at the top of the file. Each field starts with a dash prefix.
        </p>
        <pre class="t-code">-type: 2
-topic: Introduction to Machine Learning
-categories: AI, Education, Technology</pre>
        <div class="mt-2 space-y-1 text-gray-500 leading-relaxed">
          <p><code class="font-mono text-gray-700">-type</code> — Script type as integer: 0=General, 1=Drama, 2=Lecture, 3=News, 4=Interview</p>
          <p><code class="font-mono text-gray-700">-topic</code> — Main topic or title of the script</p>
          <p><code class="font-mono text-gray-700">-categories</code> — Comma-separated category tags</p>
        </div>
      </div>

      <!-- Delimiter -->
      <div>
        <h3 class="font-mono font-semibold text-gray-800 mb-1">Delimiter</h3>
        <p class="leading-relaxed">
          Use <code class="font-mono text-gray-700">---</code> on its own line to separate front matter from the body.
          This delimiter must appear exactly once.
        </p>
      </div>

      <!-- Row Metadata -->
      <div>
        <h3 class="font-mono font-semibold text-gray-800 mb-1">Row Metadata</h3>
        <p class="mb-2 leading-relaxed">
          Attach metadata to the next dialogue line using double-dash prefix.
          Multiple metadata lines can precede a single dialogue.
        </p>
        <pre class="t-code">--chapter: Introduction
--note: Key concept explanation
--visual: diagram of neural network</pre>
        <div class="mt-2 space-y-1 text-gray-500 leading-relaxed">
          <p><code class="font-mono text-gray-700">--key: value</code> — Stored as key-value pairs on the slide</p>
          <p>Common keys: <code class="font-mono">chapter</code>, <code class="font-mono">section</code>, <code class="font-mono">note</code>, <code class="font-mono">visual</code></p>
        </div>
      </div>

      <!-- Dialogue Format -->
      <div>
        <h3 class="font-mono font-semibold text-gray-800 mb-1">Dialogue Format</h3>
        <p class="mb-2 leading-relaxed">
          Each dialogue line produces one slide. The format is:
        </p>
        <pre class="t-code">name[role]: (visual description) dialogue text</pre>
        <div class="mt-2 space-y-1 text-gray-500 leading-relaxed">
          <p><code class="font-mono text-gray-700">name</code> — Speaker name (required)</p>
          <p><code class="font-mono text-gray-700">[role]</code> — Speaker role in brackets (required)</p>
          <p><code class="font-mono text-gray-700">(description)</code> — Optional visual hint in parentheses</p>
          <p><code class="font-mono text-gray-700">dialogue</code> — The spoken text (becomes slide body)</p>
        </div>
      </div>

      <!-- Block Separation -->
      <div>
        <h3 class="font-mono font-semibold text-gray-800 mb-1">Block Separation</h3>
        <p class="leading-relaxed">
          Use blank lines to visually group dialogue blocks. Blank lines are ignored by the parser
          but help organize the script for readability.
        </p>
      </div>

      <!-- Complete Example -->
      <div>
        <h3 class="font-mono font-semibold text-gray-800 mb-1">Complete Example</h3>
        <pre class="t-code">-type: 2
-topic: Introduction to AI
-categories: Technology, Education
---
--chapter: Opening
--note: Set the context

Instructor[Presenter]: (title slide) Welcome to today's lecture on Artificial Intelligence.

Instructor[Presenter]: (bullet points) We'll cover three main topics: machine learning basics, neural networks, and practical applications.

--chapter: Main Content

Instructor[Presenter]: (diagram) Machine learning is a subset of AI that enables systems to learn from data.

--note: Key takeaway

Instructor[Presenter]: The most important thing to remember is that AI augments human capabilities rather than replacing them.</pre>
      </div>

    </div>
  </details>
</div>
