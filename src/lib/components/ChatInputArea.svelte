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
		disabled = false
	}: {
		currentSpeakerId: string;
		speakers: SpeakerProfile[];
		onSpeakerChange: (id: string) => void;
		onSubmit: (dialogue: string, visualHint: string) => void;
		onAddSpeaker: (name: string, role: string, color?: string) => void;
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
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="t-card overflow-visible">
	<SpeakerSelector
		{currentSpeakerId}
		{speakers}
		onSelect={onSpeakerChange}
		onAdd={onAddSpeaker}
		onRemove={onRemoveSpeaker}
	/>

	<input
		type="text"
		class="w-full px-3 py-2 text-xs text-gray-600 placeholder-gray-400 t-input-border"
		placeholder="Visual hint / scene description (optional)"
		bind:value={visualHint}
		{disabled}
	/>

	<textarea
		class="w-full px-3 py-2 text-sm text-gray-800 placeholder-gray-400 resize-none outline-none"
		rows="3"
		placeholder="Enter dialogue..."
		bind:value={dialogue}
		onkeydown={handleKeydown}
		{disabled}
	></textarea>

	<div class="flex justify-end">
		<button
			class="px-3 py-1.5 text-[13px] cursor-pointer transition-colors
          {hasPendingMetadata
				? 'text-gray-900 font-semibold'
				: 'text-gray-500 hover:text-gray-800'}"
			onclick={onMetadataClick}
			{disabled}
		>
			{hasPendingMetadata ? '[meta *]' : '[meta]'}
		</button>
		<button
			class="px-3 py-1.5 text-[13px] font-semibold text-white cursor-pointer transition-opacity"
			style="background-color: {currentSpeaker?.color || '#6b7280'};"
			class:opacity-40={!canSubmit}
			class:cursor-not-allowed={!canSubmit}
			onclick={handleSubmit}
			disabled={!canSubmit}
		>
			[<span class="underline">send</span>]
		</button>
	</div>
</div>
