<script lang="ts">
	import type { ChatMessage, SpeakerProfile } from '$lib/types';
	import { lightenColor } from '$lib/utils/colorUtils';

	let {
		message,
		speaker,
		align,
		onEdit,
		onDelete,
		onUpdate
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

	function nl2br(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\n/g, '<br>');
	}

	const bgColor = $derived(lightenColor(speaker.color, 85));
	const metaEntries = $derived(Object.entries(message.metadata));
	const metaText = $derived(metaEntries.map(([k, v]) => `${k}: ${v}`).join(' · '));
	const textAlign = $derived(align === 'right' ? 'text-right' : 'text-left');
	const justifyAlign = $derived(align === 'right' ? 'justify-end' : 'justify-start');
</script>

<div class="w-fit max-w-full {align === 'right' ? 'ml-auto' : 'mr-auto'}">
	<div
		class="px-5 py-2.5 text-sm break-words {textAlign}"
		style="background-color: {bgColor}; border-top: 2px solid {speaker.color};"
	>
		<!-- Header -->
		<div class="mb-1">
			<span class="text-xs font-medium" style="color: {speaker.color};">
				{speaker.name} <span class="font-normal text-gray-400">[{speaker.role}]</span>
			</span>
		</div>

		<!-- Edit mode -->
		{#if message.isEditing}
			<div class="flex flex-col">
				<input
					type="text"
					class="text-xs text-gray-500 mb-0.5 t-input-border {textAlign}"
					style="background-color: transparent; field-sizing: content;"
					placeholder="(visual hint)"
					bind:value={editVisualHint}
				/>
				<textarea
					class="text-sm text-gray-800 leading-relaxed t-input-border resize-none {textAlign}"
					style="background-color: transparent; field-sizing: content;"
					placeholder="Dialogue"
					bind:value={editDialogue}
					onkeydown={handleKeydown}
				></textarea>
				<div class="flex gap-1 items-center {justifyAlign} mt-1.5">
					<button
						class="text-[10px] font-bold text-gray-900 hover:text-gray-600 cursor-pointer"
						onclick={cancelEdit}>[cancel]</button
					>
					<span class="text-[10px] text-gray-900">/</span>
					<button
						class="text-[10px] font-bold cursor-pointer transition-colors"
						style="color: {speaker.color};"
						onclick={saveEdit}>[<span class="underline">save</span>]</button
					>
				</div>
			</div>
		{:else}
			<!-- Visual hint -->
			{#if message.visualHint}
				<p class="text-xs text-gray-500 mb-0.5">({message.visualHint})</p>
			{/if}

			<!-- Dialogue -->
			<p class="text-gray-800 text-sm leading-relaxed break-words">
				{@html nl2br(message.dialogue)}
			</p>

			<!-- Edited indicator -->
			{#if message.isEdited}
				<div class="text-[10px] text-gray-400 mt-0.5">/edited</div>
			{/if}

			<!-- Action buttons -->
			<div class="flex gap-1 items-center {justifyAlign} mt-1.5">
				<button
					class="text-[10px] font-bold text-gray-900 hover:text-red-600 cursor-pointer"
					onclick={() => onDelete(message.id)}>[del]</button
				>
				<span class="text-[10px] text-gray-900">/</span>
				<button
					class="text-[10px] font-bold text-gray-900 hover:text-gray-600 cursor-pointer"
					onclick={startEdit}>[edit]</button
				>
			</div>
		{/if}
	</div>

	<!-- Metadata callout -->
	{#if metaEntries.length > 0 && !message.isEditing}
		<div class="px-5 py-0.5 text-xs text-gray-400 truncate {textAlign}" title={metaText}>
			{metaText}
		</div>
	{/if}
</div>
