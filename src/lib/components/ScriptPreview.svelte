<script lang="ts">
  import type { ParseResult } from '$lib/types';

  let { parseResult }: { parseResult: ParseResult } = $props();
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

  <!-- Speakers summary -->
  <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
    {#each parseResult.metadata.speakers as speaker, i}
      <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
        {speaker} [{parseResult.metadata.roles[i] || '?'}]
      </span>
    {/each}
  </div>

  <!-- Lines -->
  <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
    {#each parseResult.lines as line}
      <div class="px-6 py-3 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs text-gray-400 font-mono w-6">#{line.lineNumber}</span>
          <span class="font-medium text-gray-700 text-sm">{line.speaker}</span>
          <span class="text-xs text-gray-400">[{line.role}]</span>
          {#if line.description}
            <span class="text-xs text-purple-600 italic">({line.description})</span>
          {/if}
        </div>
        <p class="ml-8 text-gray-600 text-sm">{line.dialogue}</p>
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
