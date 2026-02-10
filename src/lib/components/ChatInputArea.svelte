<script lang="ts">
  import type { SpeakerProfile } from '$lib/types';
  import SpeakerSelector from './SpeakerSelector.svelte';

  let {
    currentSpeakerId,
    speakers,
    onSpeakerChange,
    onSubmit,
    onAddSpeaker,
    onRemoveSpeaker,
    onMetadataClick,
    hasPendingMetadata = false,
    disabled = false,
  }: {
    currentSpeakerId: string;
    speakers: SpeakerProfile[];
    onSpeakerChange: (id: string) => void;
    onSubmit: (dialogue: string, visualHint: string) => void;
    onAddSpeaker: (name: string, role: string) => void;
    onRemoveSpeaker: (id: string) => void;
    onMetadataClick: () => void;
    hasPendingMetadata?: boolean;
    disabled?: boolean;
  } = $props();

  let dialogue = $state('');
  let visualHint = $state('');

  const currentSpeaker = $derived(speakers.find((s) => s.id === currentSpeakerId));
  const canSubmit = $derived(dialogue.trim().length > 0 && !disabled);

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(dialogue.trim(), visualHint.trim());
    dialogue = '';
    visualHint = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="t-card overflow-visible">
  <!-- Speaker selector -->
  <div class="px-3 py-2 border-b border-gray-200">
    <SpeakerSelector
      {currentSpeakerId}
      {speakers}
      onSelect={onSpeakerChange}
      onAdd={onAddSpeaker}
      onRemove={onRemoveSpeaker}
    />
  </div>

  <!-- Visual hint -->
  <div class="px-3 pt-2">
    <input
      type="text"
      class="w-full px-2 py-1 text-xs border border-gray-200 font-mono text-gray-600 placeholder-gray-400"
      placeholder="Visual hint / scene description (optional)"
      bind:value={visualHint}
      {disabled}
    />
  </div>

  <!-- Dialogue + actions -->
  <div class="px-3 py-2">
    <textarea
      class="w-full px-2 py-1.5 text-sm border font-mono text-gray-800 placeholder-gray-400 resize-none"
      style="border-color: {currentSpeaker?.color || '#d1d5db'};"
      rows="3"
      placeholder="Enter dialogue..."
      bind:value={dialogue}
      onkeydown={handleKeydown}
      {disabled}
    ></textarea>

    <div class="flex items-center justify-between mt-2">
      <button
        class="text-xs font-mono cursor-pointer px-2 py-1 border transition-colors
          {hasPendingMetadata ? 'border-gray-900 text-gray-900 font-semibold' : 'border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400'}"
        onclick={onMetadataClick}
        {disabled}
      >
        {hasPendingMetadata ? '[meta *]' : '[meta]'}
      </button>

      <button
        class="px-3 py-1 text-xs font-mono text-white cursor-pointer transition-opacity"
        style="background-color: {currentSpeaker?.color || '#6b7280'};"
        class:opacity-40={!canSubmit}
        class:cursor-not-allowed={!canSubmit}
        onclick={handleSubmit}
        disabled={!canSubmit}
      >
        Send
      </button>
    </div>
  </div>
</div>
