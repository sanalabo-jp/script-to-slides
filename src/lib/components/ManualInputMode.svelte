<script lang="ts">
	import { tick } from 'svelte';
	import type { ChatMessage, SpeakerProfile, ScriptFrontMatter, ParseResult } from '$lib/types';
	import { generateSpeakerColor } from '$lib/utils/colorUtils';
	import { buildParseResult } from '$lib/utils/chatTransform';
	import FrontMatterForm from './FrontMatterForm.svelte';
	import ChatCell from './ChatCell.svelte';
	import ChatInputArea from './ChatInputArea.svelte';
	import MetadataModal from './MetadataModal.svelte';

	let {
		onComplete
	}: {
		onComplete: (parseResult: ParseResult) => void;
	} = $props();

	// === State ===
	let frontMatter: ScriptFrontMatter | null = $state(null);
	const defaultSpeakerId = crypto.randomUUID();
	let speakers = $state<SpeakerProfile[]>([
		{
			id: defaultSpeakerId,
			name: 'Speaker',
			role: 'Narrator',
			color: generateSpeakerColor(),
			isDefault: true
		}
	]);
	let currentSpeakerId: string = $state(defaultSpeakerId);
	let messages = $state<ChatMessage[]>([]);
	let pendingMetadata = $state<Record<string, string>>({});
	let showMetadataModal = $state(false);
	let errorMsg = $state('');
	let chatAreaEl: HTMLDivElement;
	let scrollTrigger = $state(0);
	let isAtBottom = $state(true);

	// === Derived ===
	const isChatting = $derived(frontMatter !== null);
	const hasPendingMeta = $derived(Object.keys(pendingMetadata).length > 0);

	// === Auto-scroll only on new message submission ===
	$effect(() => {
		scrollTrigger;
		if (chatAreaEl) {
			tick().then(() => {
				chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
				isAtBottom = true;
			});
		}
	});

	function handleChatScroll() {
		if (!chatAreaEl) return;
		const { scrollTop, scrollHeight, clientHeight } = chatAreaEl;
		isAtBottom = scrollHeight - scrollTop - clientHeight < 24;
	}

	function scrollToBottom() {
		if (!chatAreaEl) return;
		chatAreaEl.scrollTo({ top: chatAreaEl.scrollHeight, behavior: 'smooth' });
	}

	// === Alignment logic ===
	function getAlign(index: number): 'left' | 'right' {
		if (index === 0) return 'right';
		const current = messages[index].speakerId;
		const prev = messages[index - 1].speakerId;
		if (current === prev) {
			return getAlign(index - 1);
		}
		const prevAlign = getAlign(index - 1);
		return prevAlign === 'right' ? 'left' : 'right';
	}

	// === Helpers ===
	function getTypeLabel(type?: number): string {
		const labels = ['General', 'Drama', 'Lecture', 'News', 'Interview'];
		return labels[type ?? 0] ?? 'General';
	}

	function getSpeakerById(id: string): SpeakerProfile {
		return speakers.find((s) => s.id === id) ?? speakers[0];
	}

	// === Handlers ===
	function handleFrontMatterSubmit(config: ScriptFrontMatter) {
		frontMatter = config;
	}

	function handleAddSpeaker(name: string, role: string, color?: string) {
		const newSpeaker: SpeakerProfile = {
			id: crypto.randomUUID(),
			name,
			role,
			color: color || generateSpeakerColor(),
			isDefault: false
		};
		speakers = [...speakers, newSpeaker];
		currentSpeakerId = newSpeaker.id;
	}

	function handleRemoveSpeaker(id: string) {
		if (speakers.length <= 1) return;
		speakers = speakers.filter((s) => s.id !== id);
		if (currentSpeakerId === id) {
			currentSpeakerId = speakers[0].id;
		}
	}

	function handleSubmitMessage(dialogue: string, visualHint: string) {
		const msg: ChatMessage = {
			id: crypto.randomUUID(),
			speakerId: currentSpeakerId,
			dialogue,
			visualHint,
			metadata: { ...pendingMetadata },
			timestamp: Date.now(),
			isEditing: false,
			isEdited: false
		};
		messages = [...messages, msg];
		scrollTrigger++;
	}

	function handleEditMessage(id: string) {
		messages = messages.map((m) => ({
			...m,
			isEditing: m.id === id
		}));
	}

	function handleUpdateMessage(id: string, dialogue: string, visualHint: string) {
		messages = messages.map((m) => {
			if (m.id !== id) return m;
			const changed = m.dialogue !== dialogue || m.visualHint !== visualHint;
			return { ...m, dialogue, visualHint, isEditing: false, isEdited: changed || m.isEdited };
		});
	}

	function handleDeleteMessage(id: string) {
		messages = messages.filter((m) => m.id !== id);
	}

	function handleMetadataSave(meta: Record<string, string>) {
		pendingMetadata = meta;
		showMetadataModal = false;
	}

	function handleDone() {
		if (messages.length === 0) {
			errorMsg = 'At least one message is required.';
			return;
		}
		if (!frontMatter) return;
		errorMsg = '';
		const result = buildParseResult(frontMatter, messages, speakers);
		onComplete(result);
	}
</script>

<div>
	<!-- Phase 1: Front matter setup -->
	{#if !isChatting}
		<FrontMatterForm onSubmit={handleFrontMatterSubmit} />
	{:else}
		<!-- Front matter locked summary -->
		<div class="px-4 py-2 bg-white" style="border: 1px solid black;">
			<div class="flex items-center gap-2">
				<span class="text-xs text-gray-400">[locked]</span>
				<span class="text-xs text-gray-500">{getTypeLabel(frontMatter?.type)}</span>
				<span class="text-xs text-gray-300">|</span>
				<span class="text-xs text-gray-700 font-medium">{frontMatter?.topic}</span>
				{#if frontMatter?.categories && frontMatter.categories.length > 0}
					<span class="text-xs text-gray-300">|</span>
					<span class="text-xs text-gray-500">{frontMatter.categories.join(', ')}</span>
				{/if}
			</div>
		</div>

		<!-- Chat area (flush with summary above via -mt-px) -->
		<div class="relative -mt-px">
			<div
				bind:this={chatAreaEl}
				class="t-card h-96 overflow-y-auto hide-scrollbar"
				onscroll={handleChatScroll}
			>
				{#if messages.length === 0}
					<p class="text-center text-xs text-gray-400 py-8 px-3">
						No messages yet. Start typing below.
					</p>
				{:else}
					{#each messages as message, i}
						<ChatCell
							{message}
							speaker={getSpeakerById(message.speakerId)}
							align={getAlign(i)}
							onEdit={handleEditMessage}
							onDelete={handleDeleteMessage}
							onUpdate={handleUpdateMessage}
						/>
					{/each}
				{/if}
			</div>

			{#if !isAtBottom && messages.length > 0}
				<button
					class="absolute left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-300 cursor-pointer hover:text-gray-900 hover:border-gray-900 transition-colors"
					style="bottom: -10px; z-index: 10;"
					onclick={scrollToBottom}
				>
					[&darr; latest]
				</button>
			{/if}
		</div>

		<!-- Input area (flush with chat above via -mt-px) -->
		<div class="-mt-px">
			<ChatInputArea
				{currentSpeakerId}
				{speakers}
				onSpeakerChange={(id) => {
					currentSpeakerId = id;
				}}
				onSubmit={handleSubmitMessage}
				onAddSpeaker={handleAddSpeaker}
				onRemoveSpeaker={handleRemoveSpeaker}
				onMetadataClick={() => {
					showMetadataModal = true;
				}}
				hasPendingMetadata={hasPendingMeta}
			/>
		</div>

		<!-- Error -->
		{#if errorMsg}
			<p class="text-xs text-red-600 mt-2">[error] {errorMsg}</p>
		{/if}

		<!-- Done button -->
		<div class="flex justify-end mt-2">
			<button class="t-btn" onclick={handleDone}
				>[<span class="underline">done — proceed to preview &rarr;</span>]</button
			>
		</div>
	{/if}
</div>

<!-- Metadata modal (portal to body, prevents footer push) -->
{#if showMetadataModal}
	<MetadataModal
		{pendingMetadata}
		onSave={handleMetadataSave}
		onCancel={() => {
			showMetadataModal = false;
		}}
	/>
{/if}
