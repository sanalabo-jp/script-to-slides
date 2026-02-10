<script lang="ts">
  let {
    pendingMetadata,
    onSave,
    onCancel,
  }: {
    pendingMetadata: Record<string, string>;
    onSave: (metadata: Record<string, string>) => void;
    onCancel: () => void;
  } = $props();

  let pairs = $state<{ key: string; value: string }[]>(
    Object.entries(pendingMetadata).map(([key, value]) => ({ key, value }))
  );

  function addPair() {
    pairs = [...pairs, { key: '', value: '' }];
  }

  function removePair(index: number) {
    pairs = pairs.filter((_, i) => i !== index);
  }

  function handleSave() {
    const result: Record<string, string> = {};
    for (const pair of pairs) {
      const k = pair.key.trim();
      const v = pair.value.trim();
      if (k && v) {
        result[k] = v;
      }
    }
    onSave(result);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<div class="modal-overlay" onclick={onCancel} onkeydown={handleKeydown} role="dialog" tabindex="-1">
  <div class="modal-card" role="document" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
    <h3 class="text-sm font-mono font-semibold text-gray-800 mb-3">Row Metadata</h3>
    <p class="text-xs text-gray-500 mb-3">Applies to the next message only</p>

    <div class="space-y-2 mb-4">
      {#each pairs as pair, i}
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="flex-1 px-2 py-1 text-xs border border-gray-300 font-mono"
            placeholder="key"
            bind:value={pair.key}
          />
          <input
            type="text"
            class="flex-1 px-2 py-1 text-xs border border-gray-300 font-mono"
            placeholder="value"
            bind:value={pair.value}
          />
          <button
            class="text-xs text-gray-400 hover:text-red-600 font-mono cursor-pointer"
            onclick={() => removePair(i)}
          >x</button>
        </div>
      {/each}
    </div>

    <button
      class="text-xs font-mono text-gray-500 hover:text-gray-800 cursor-pointer mb-4"
      onclick={addPair}
    >+ Add pair</button>

    <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
      <button class="t-btn-text text-xs" onclick={onCancel}>Cancel</button>
      <button class="t-btn text-xs" onclick={handleSave}>Save</button>
    </div>
  </div>
</div>
