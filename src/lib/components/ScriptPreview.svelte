<script lang="ts">
  import type { ParseResult } from '$lib/types';
  import { ScriptType } from '$lib/types';

  let { parseResult }: { parseResult: ParseResult } = $props();

  const typeLabels: Record<number, string> = {
    [ScriptType.General]: 'General',
    [ScriptType.Drama]: 'Drama',
    [ScriptType.Lecture]: 'Lecture',
    [ScriptType.News]: 'News',
    [ScriptType.Interview]: 'Interview',
  };
</script>

<div class="t-card overflow-hidden">
  <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
    <div>
      <h2 class="text-sm font-mono font-semibold text-gray-800">Script Preview</h2>
      <p class="text-xs text-gray-500 mt-0.5 font-mono">
        {parseResult.metadata.validLines} valid / {parseResult.metadata.totalLines} total
        · {parseResult.metadata.speakers.length} speaker{parseResult.metadata.speakers.length !== 1 ? 's' : ''}
      </p>
    </div>
    <div>
      {#if parseResult.isValid}
        <span class="px-2 py-0.5 border border-green-400 text-green-700 text-xs font-mono">valid</span>
      {:else}
        <span class="px-2 py-0.5 border border-red-400 text-red-700 text-xs font-mono">invalid</span>
      {/if}
    </div>
  </div>

  <!-- Front matter -->
  {#if parseResult.frontMatter.topic}
    <div class="px-4 py-2 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center gap-2 text-xs font-mono">
        <span class="px-1.5 py-0.5 border border-gray-300 text-gray-700">
          {typeLabels[parseResult.frontMatter.type] || 'General'}
        </span>
        <span class="text-gray-700">{parseResult.frontMatter.topic}</span>
        {#if parseResult.frontMatter.categories.length > 0}
          <span class="text-gray-300">|</span>
          {#each parseResult.frontMatter.categories as cat}
            <span class="text-gray-500">{cat}</span>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Speakers summary -->
  <div class="px-4 py-2 border-b border-gray-200 flex flex-wrap gap-1.5">
    {#each parseResult.metadata.speakers as speaker}
      <span class="px-1.5 py-0.5 border border-gray-300 text-xs font-mono text-gray-700">
        {speaker.name} [{speaker.role}]
      </span>
    {/each}
  </div>

  <!-- Slides -->
  <div class="max-h-80 overflow-y-auto divide-y divide-gray-100">
    {#each parseResult.slides as slide}
      <div class="px-4 py-2 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-xs text-gray-400 font-mono w-6">#{slide.lineNumber}</span>
          <span class="font-mono text-gray-700 text-xs font-medium">{slide.speaker.name}</span>
          <span class="text-xs text-gray-400 font-mono">[{slide.speaker.role}]</span>
          {#if slide.visualHint}
            <span class="text-xs text-gray-500">({slide.visualHint})</span>
          {/if}
        </div>
        {#if Object.keys(slide.metadata).length > 0}
          <div class="ml-8 mb-0.5">
            {#each Object.entries(slide.metadata) as [key, value]}
              <span class="text-xs text-gray-400 font-mono mr-2">--{key}: {value}</span>
            {/each}
          </div>
        {/if}
        <p class="ml-8 text-gray-600 text-xs leading-relaxed">{slide.context}</p>
      </div>
    {/each}
  </div>

  <!-- Errors -->
  {#if parseResult.errors.length > 0}
    <div class="px-4 py-2 border-t border-gray-200 border-l-2 border-l-red-300 bg-white">
      <p class="text-xs font-mono text-red-700 mb-1">
        [error] {parseResult.errors.length} line{parseResult.errors.length !== 1 ? 's' : ''} could not be parsed:
      </p>
      <div class="max-h-32 overflow-y-auto space-y-0.5">
        {#each parseResult.errors.slice(0, 5) as err}
          <p class="text-xs text-gray-500 font-mono truncate">
            L{err.line}: {err.content}
          </p>
        {/each}
        {#if parseResult.errors.length > 5}
          <p class="text-xs text-gray-400 font-mono">...and {parseResult.errors.length - 5} more</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
