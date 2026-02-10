<script lang="ts">
  import { ScriptType } from '$lib/types';
  import type { ScriptFrontMatter } from '$lib/types';

  let {
    onSubmit,
  }: {
    onSubmit: (config: ScriptFrontMatter) => void;
  } = $props();

  let type = $state<ScriptType>(ScriptType.General);
  let topic = $state('');
  let categoriesRaw = $state('');
  let error = $state('');

  const typeOptions: { value: ScriptType; label: string }[] = [
    { value: ScriptType.General, label: 'General' },
    { value: ScriptType.Drama, label: 'Drama' },
    { value: ScriptType.Lecture, label: 'Lecture' },
    { value: ScriptType.News, label: 'News' },
    { value: ScriptType.Interview, label: 'Interview' },
  ];

  function handleSubmit() {
    if (!topic.trim()) {
      error = 'Topic is required';
      return;
    }
    error = '';
    const categories = categoriesRaw
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    onSubmit({ type, topic: topic.trim(), categories });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="t-card p-4 space-y-3">
  <h3 class="text-sm font-mono font-semibold text-gray-800">Front Matter Settings</h3>
  <p class="text-xs text-gray-500">Configure script metadata before starting. This cannot be changed later.</p>

  <!-- Type -->
  <div>
    <label for="fm-type" class="text-xs font-mono text-gray-600 mb-1 block">Type</label>
    <select
      id="fm-type"
      class="w-full px-2 py-1.5 text-xs border border-gray-300 font-mono bg-white text-gray-800"
      bind:value={type}
    >
      {#each typeOptions as opt}
        <option value={opt.value}>{opt.value} — {opt.label}</option>
      {/each}
    </select>
  </div>

  <!-- Topic -->
  <div>
    <label for="fm-topic" class="text-xs font-mono text-gray-600 mb-1 block">Topic <span class="text-red-500">*</span></label>
    <input
      id="fm-topic"
      type="text"
      class="w-full px-2 py-1.5 text-xs border border-gray-300 font-mono"
      placeholder="Main topic or title"
      bind:value={topic}
      onkeydown={handleKeydown}
    />
  </div>

  <!-- Categories -->
  <div>
    <label for="fm-categories" class="text-xs font-mono text-gray-600 mb-1 block">Categories</label>
    <input
      id="fm-categories"
      type="text"
      class="w-full px-2 py-1.5 text-xs border border-gray-300 font-mono"
      placeholder="Comma-separated (e.g. AI, Education)"
      bind:value={categoriesRaw}
      onkeydown={handleKeydown}
    />
  </div>

  {#if error}
    <p class="text-xs font-mono text-red-600">[error] {error}</p>
  {/if}

  <button
    class="t-btn text-xs w-full"
    onclick={handleSubmit}
  >
    Set Front Matter & Start
  </button>
</div>
