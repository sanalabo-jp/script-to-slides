<script lang="ts">
  import type { ChatMessage, SpeakerProfile } from '$lib/types';
  import { lightenColor } from '$lib/utils/colorUtils';

  let {
    message,
    speaker,
    align,
    onEdit,
    onDelete,
    onUpdate,
  }: {
    message: ChatMessage;
    speaker: SpeakerProfile;
    align: 'left' | 'right';
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, dialogue: string, visualHint: string) => void;
  } = $props();

  let editDialogue = $state('');
  let editVisualHint = $state('');

  function startEdit() {
    editDialogue = message.dialogue;
    editVisualHint = message.visualHint;
    onEdit(message.id);
  }

  function saveEdit() {
    if (editDialogue.trim()) {
      onUpdate(message.id, editDialogue.trim(), editVisualHint.trim());
    }
  }

  function cancelEdit() {
    onUpdate(message.id, message.dialogue, message.visualHint);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  }

  const bgColor = $derived(lightenColor(speaker.color, 85));
  const borderColor = $derived(lightenColor(speaker.color, 40));
  const metaEntries = $derived(Object.entries(message.metadata));
  const metaText = $derived(metaEntries.map(([k, v]) => `${k}: ${v}`).join(' · '));
</script>

<div
  class="animate-cell-in max-w-[75%] {align === 'right' ? 'ml-auto' : 'mr-auto'}"
>
  <div
    class="px-3 py-2 text-sm"
    style="background-color: {bgColor}; border: 1px solid {borderColor};"
  >
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 mb-1">
      <span class="text-xs font-mono font-medium" style="color: {speaker.color};">
        {speaker.name} <span class="font-normal text-gray-400">[{speaker.role}]</span>
      </span>
      {#if !message.isEditing}
        <div class="flex gap-1.5">
          <button
            class="text-xs text-gray-400 hover:text-gray-700 font-mono cursor-pointer"
            onclick={startEdit}
          >edit</button>
          <button
            class="text-xs text-gray-400 hover:text-red-600 font-mono cursor-pointer"
            onclick={() => onDelete(message.id)}
          >x</button>
        </div>
      {/if}
    </div>

    <!-- Edit mode -->
    {#if message.isEditing}
      <div class="space-y-1.5">
        <input
          type="text"
          class="w-full px-2 py-1 text-xs border border-gray-300 font-mono bg-white"
          placeholder="Visual hint (optional)"
          bind:value={editVisualHint}
        />
        <textarea
          class="w-full px-2 py-1 text-xs border border-gray-300 font-mono bg-white resize-none"
          rows="2"
          placeholder="Dialogue"
          bind:value={editDialogue}
          onkeydown={handleKeydown}
        ></textarea>
        <div class="flex gap-1.5 justify-end">
          <button class="text-xs text-gray-400 hover:text-gray-700 font-mono cursor-pointer" onclick={cancelEdit}>cancel</button>
          <button class="text-xs font-mono cursor-pointer" style="color: {speaker.color};" onclick={saveEdit}>save</button>
        </div>
      </div>
    {:else}
      <!-- Visual hint -->
      {#if message.visualHint}
        <p class="text-xs text-gray-500 mb-0.5">({message.visualHint})</p>
      {/if}

      <!-- Dialogue -->
      <p class="text-gray-800 text-sm leading-relaxed">{message.dialogue}</p>
    {/if}
  </div>

  <!-- Metadata callout -->
  {#if metaEntries.length > 0 && !message.isEditing}
    <div
      class="px-2 py-0.5 text-xs font-mono text-gray-400 truncate {align === 'right' ? 'text-right' : 'text-left'}"
      title={metaText}
    >
      {metaText}
    </div>
  {/if}
</div>
