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

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
    <div>
      <h2 class="font-semibold text-gray-800">Script Preview</h2>
      <p class="text-sm text-gray-500 mt-1">
        {parseResult.metadata.validLines} valid lines of {parseResult.metadata.totalLines} total
        · {parseResult.metadata.speakers.length} speaker{parseResult.metadata.speakers.length !== 1 ? 's' : ''}
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if parseResult.isValid}
        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Valid</span>
      {:else}
        <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Invalid</span>
      {/if}
    </div>
  </div>

  <!-- Front matter -->
  {#if parseResult.frontMatter.topic}
    <div class="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
      <div class="flex items-center gap-3 text-sm">
        <span class="px-2 py-0.5 bg-indigo-200 text-indigo-700 rounded text-xs font-medium">
          {typeLabels[parseResult.frontMatter.type] || 'General'}
        </span>
        <span class="text-indigo-700 font-medium">{parseResult.frontMatter.topic}</span>
        {#if parseResult.frontMatter.categories.length > 0}
          <span class="text-indigo-400">·</span>
          {#each parseResult.frontMatter.categories as cat}
            <span class="text-xs text-indigo-500">{cat}</span>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Speakers summary -->
  <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
    {#each parseResult.metadata.speakers as speaker}
      <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
        {speaker.name} [{speaker.role}]
      </span>
    {/each}
  </div>

  <!-- Slides -->
  <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
    {#each parseResult.slides as slide}
      <div class="px-6 py-3 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs text-gray-400 font-mono w-6">#{slide.lineNumber}</span>
          <span class="font-medium text-gray-700 text-sm">{slide.speaker.name}</span>
          <span class="text-xs text-gray-400">[{slide.speaker.role}]</span>
          {#if slide.visualHint}
            <span class="text-xs text-purple-600 italic">({slide.visualHint})</span>
          {/if}
        </div>
        {#if Object.keys(slide.metadata).length > 0}
          <div class="ml-8 mb-1">
            {#each Object.entries(slide.metadata) as [key, value]}
              <span class="text-xs text-gray-400 mr-2">{key}: {value}</span>
            {/each}
          </div>
        {/if}
        <p class="ml-8 text-gray-600 text-sm">{slide.context}</p>
      </div>
    {/each}
  </div>

  <!-- Errors -->
  {#if parseResult.errors.length > 0}
    <div class="px-6 py-3 bg-amber-50 border-t border-amber-100">
      <p class="text-sm font-medium text-amber-700 mb-2">
        {parseResult.errors.length} line{parseResult.errors.length !== 1 ? 's' : ''} could not be parsed:
      </p>
      <div class="max-h-32 overflow-y-auto space-y-1">
        {#each parseResult.errors.slice(0, 5) as err}
          <p class="text-xs text-amber-600 font-mono truncate">
            Line {err.line}: {err.content}
          </p>
        {/each}
        {#if parseResult.errors.length > 5}
          <p class="text-xs text-amber-500 italic">...and {parseResult.errors.length - 5} more</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
