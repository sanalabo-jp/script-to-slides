<script lang="ts">
	import type { SpeakerProfile } from '$lib/types';
	import { generateSpeakerColor } from '$lib/utils/colorUtils';

	let {
		currentSpeakerId,
		speakers,
		onSelect,
		onAdd,
		onRemove
	}: {
		currentSpeakerId: string;
		speakers: SpeakerProfile[];
		onSelect: (id: string) => void;
		onAdd: (name: string, role: string, color?: string) => void;
		onRemove: (id: string) => void;
	} = $props();

	let isOpen = $state(false);
	let showAddForm = $state(false);
	let newName = $state('');
	let newRole = $state('');
	let previewColor = $state('');

	const currentSpeaker = $derived(speakers.find((s) => s.id === currentSpeakerId));

	$effect(() => {
		if (!isOpen) {
			showAddForm = false;
			newName = '';
			newRole = '';
			previewColor = '';
		}
	});

	function openAddForm() {
		previewColor = generateSpeakerColor();
		showAddForm = true;
	}

	function handleAdd() {
		if (newName.trim() && newRole.trim()) {
			onAdd(newName.trim(), newRole.trim(), previewColor);
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
	<!-- Trigger button -->
	<button
		class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer w-full text-left transition-colors hover:bg-gray-50"
		style="border: 1px solid {currentSpeaker?.color || '#999'}; {isOpen
			? 'border-bottom: none;'
			: ''}"
		onclick={() => {
			isOpen = !isOpen;
		}}
	>
		{#if isOpen}
			<span class="text-gray-400">Select speaker...</span>
		{:else if currentSpeaker}
			<span
				class="w-2 h-2 rounded-full inline-block flex-shrink-0"
				style="background-color: {currentSpeaker.color};"
			></span>
			<span class="text-gray-800">{currentSpeaker.name}</span>
			<span class="text-gray-400">[{currentSpeaker.role}]</span>
		{:else}
			<span class="text-gray-400">Select speaker...</span>
		{/if}
		<span class="ml-auto text-[10px] text-gray-400">{isOpen ? '[^]' : '[v]'}</span>
	</button>

	{#if isOpen}
		<!-- Backdrop to dismiss dropdown -->
		<button
			class="fixed inset-0 cursor-default"
			style="z-index: 9;"
			onclick={() => {
				isOpen = false;
			}}
			aria-label="Close dropdown"
		></button>
		<div
			class="absolute top-full left-0 right-0 z-10 bg-white max-h-48 overflow-y-auto"
			style="border: 1px solid {currentSpeaker?.color || '#999'}; border-top: none;"
		>
			{#each speakers as speaker}
				<div class="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer">
					<button
						class="flex items-center gap-2 flex-1 text-left cursor-pointer"
						onclick={() => handleSelect(speaker.id)}
					>
						<span
							class="w-2 h-2 rounded-full inline-block flex-shrink-0"
							style="background-color: {speaker.color};"
						></span>
						<span
							class={speaker.id === currentSpeakerId
								? 'text-gray-800 font-semibold'
								: 'text-gray-600'}>{speaker.name}</span
						>
						<span class="text-gray-400">[{speaker.role}]</span>
					</button>
					{#if speakers.length > 1}
						<button
							class="text-[10px] text-gray-400 hover:text-red-600 cursor-pointer"
							onclick={(e) => {
								e.stopPropagation();
								onRemove(speaker.id);
							}}>[x]</button
						>
					{/if}
				</div>
			{/each}

			<!-- Add speaker section -->
			{#if !showAddForm}
				<button
					class="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 text-left cursor-pointer border-t border-gray-200 font-medium"
					onclick={openAddForm}>[+] add speaker</button
				>
			{:else}
				<div class="border-t border-gray-200 bg-white">
					<div class="flex gap-2">
						<input
							type="text"
							class="flex-[6] min-w-0 px-2 py-1.5 text-xs t-input-border"
							placeholder="Name"
							bind:value={newName}
							onkeydown={handleKeydown}
						/>
						<input
							type="text"
							class="flex-[4] min-w-0 px-2 py-1.5 text-xs t-input-border"
							placeholder="Role"
							bind:value={newRole}
							onkeydown={handleKeydown}
						/>
					</div>
					<div class="flex justify-end items-center gap-1">
						<button
							class="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors whitespace-nowrap"
							onclick={() => {
								showAddForm = false;
							}}>[cancel]</button
						>
						<span class="text-xs text-gray-300">/</span>
						<button
							class="px-2 py-1 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-40 whitespace-nowrap"
							style="color: {previewColor};"
							onclick={handleAdd}
							disabled={!newName.trim() || !newRole.trim()}
							>[<span class="underline">add</span>]</button
						>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
