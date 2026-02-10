<script lang="ts">
  import type { SpeakerProfile } from '$lib/types';

  let {
    currentSpeakerId,
    speakers,
    onSelect,
    onAdd,
    onRemove,
  }: {
    currentSpeakerId: string;
    speakers: SpeakerProfile[];
    onSelect: (id: string) => void;
    onAdd: (name: string, role: string) => void;
    onRemove: (id: string) => void;
  } = $props();

  let isOpen = $state(false);
  let showAddForm = $state(false);
  let newName = $state('');
  let newRole = $state('');

  const currentSpeaker = $derived(speakers.find((s) => s.id === currentSpeakerId));

  function handleAdd() {
    if (newName.trim() && newRole.trim()) {
      onAdd(newName.trim(), newRole.trim());
      newName = '';
      newRole = '';
      showAddForm = false;
    }
  }

  function handleSelect(id: string) {
    onSelect(id);
    isOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') {
      showAddForm = false;
    }
  }
</script>

<div class="relative">
  <button
    class="flex items-center gap-2 px-3 py-1.5 border text-xs font-mono cursor-pointer w-full text-left transition-colors hover:border-gray-400"
    style="border-color: {currentSpeaker?.color || '#999'};"
    onclick={() => { isOpen = !isOpen; }}
  >
    {#if currentSpeaker}
      <span class="w-2 h-2 rounded-full inline-block" style="background-color: {currentSpeaker.color};"></span>
      <span class="text-gray-800">{currentSpeaker.name}</span>
      <span class="text-gray-400">[{currentSpeaker.role}]</span>
    {:else}
      <span class="text-gray-400">Select speaker...</span>
    {/if}
    <span class="ml-auto text-gray-400">{isOpen ? '▲' : '▼'}</span>
  </button>

  {#if isOpen}
    <div class="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 mt-0.5 max-h-48 overflow-y-auto">
      {#each speakers as speaker}
        <div class="flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-gray-50 cursor-pointer
          {speaker.id === currentSpeakerId ? 'bg-gray-100 font-semibold' : ''}"
        >
          <button
            class="flex items-center gap-2 flex-1 text-left cursor-pointer"
            onclick={() => handleSelect(speaker.id)}
          >
            <span class="w-2 h-2 rounded-full" style="background-color: {speaker.color};"></span>
            <span>{speaker.name}</span>
            <span class="text-gray-400">[{speaker.role}]</span>
          </button>
          {#if speakers.length > 1}
            <button
              class="text-gray-400 hover:text-red-600 cursor-pointer"
              onclick={(e) => { e.stopPropagation(); onRemove(speaker.id); }}
            >x</button>
          {/if}
        </div>
      {/each}

      <!-- Add new speaker -->
      {#if !showAddForm}
        <button
          class="w-full px-3 py-1.5 text-xs font-mono text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left cursor-pointer border-t border-gray-200"
          onclick={() => { showAddForm = true; }}
        >+ Add speaker</button>
      {:else}
        <div class="px-3 py-2 border-t border-gray-200 space-y-1.5">
          <input
            type="text"
            class="w-full px-2 py-1 text-xs border border-gray-300 font-mono"
            placeholder="Name"
            bind:value={newName}
            onkeydown={handleKeydown}
          />
          <input
            type="text"
            class="w-full px-2 py-1 text-xs border border-gray-300 font-mono"
            placeholder="Role"
            bind:value={newRole}
            onkeydown={handleKeydown}
          />
          <div class="flex gap-1.5">
            <button
              class="text-xs font-mono text-gray-400 hover:text-gray-700 cursor-pointer"
              onclick={() => { showAddForm = false; }}
            >cancel</button>
            <button
              class="text-xs font-mono text-gray-800 font-semibold cursor-pointer disabled:opacity-40"
              onclick={handleAdd}
              disabled={!newName.trim() || !newRole.trim()}
            >add</button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
