<script lang="ts">
  import { isSuportedExtension } from '$lib/parser/scriptParser';

  let {
    onFileSelected,
  }: {
    onFileSelected: (file: File) => void;
  } = $props();

  let isDragging = $state(false);
  let errorMsg = $state('');

  function handleFile(file: File) {
    errorMsg = '';

    if (!isSuportedExtension(file.name)) {
      errorMsg = `Unsupported file type. Please upload: .txt, .md, .text, .script`;
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

<div
  class="border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
    {isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}"
  role="button"
  tabindex="0"
  ondrop={onDrop}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  onclick={() => document.getElementById('file-input')?.click()}
  onkeydown={(e) => { if (e.key === 'Enter') document.getElementById('file-input')?.click(); }}
>
  <div class="text-4xl mb-4">{isDragging ? '📥' : '📄'}</div>
  <p class="text-lg font-medium text-gray-700 mb-2">
    {isDragging ? 'Drop your script file here' : 'Upload your script file'}
  </p>
  <p class="text-sm text-gray-500 mb-4">
    Drag & drop or click to browse. Supports .txt, .md, .text, .script
  </p>
  <p class="text-xs text-gray-400">
    Format: <code class="bg-gray-100 px-1 py-0.5 rounded">name[role]: (description) dialogue</code>
  </p>

  {#if errorMsg}
    <p class="mt-4 text-sm text-red-600">{errorMsg}</p>
  {/if}

  <input
    id="file-input"
    type="file"
    accept=".txt,.md,.text,.script"
    class="hidden"
    onchange={onInputChange}
  />
</div>
