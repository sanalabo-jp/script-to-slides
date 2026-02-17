<script lang="ts">
	import type { TemplateElement, ElementName } from '$lib/types';
	import { ELEMENT_COLORS, ELEMENT_LABELS } from '$lib/templates/layoutUtils';

	interface Props {
		elements: TemplateElement[];
		disabledElements: ElementName[];
	}

	let { elements, disabledElements }: Props = $props();

	let isOpen = $state(false);
	let isDragging = $state(false);
	let popoverEl: HTMLDivElement | undefined = $state();
	let buttonEl: HTMLButtonElement | undefined = $state();

	let paletteElements = $derived(elements.filter((el) => el.enabled === false));
	let unplacedCount = $derived(paletteElements.length);
	let canvasEmpty = $derived(elements.every((el) => el.enabled === false));

	function handleDragStart(e: DragEvent, name: ElementName) {
		if (!e.dataTransfer) return;
		isDragging = true;
		e.dataTransfer.setData('text/plain', name);
		e.dataTransfer.effectAllowed = 'move';
	}

	function handleDragEnd() {
		isDragging = false;
	}

	$effect(() => {
		if (isOpen) {
			const handler = (e: PointerEvent) => {
				if (isDragging) return;
				if (popoverEl?.contains(e.target as Node)) return;
				if (buttonEl?.contains(e.target as Node)) return;
				isOpen = false;
			};
			document.addEventListener('pointerdown', handler, true);
			return () => document.removeEventListener('pointerdown', handler, true);
		}
	});
</script>

<div class="absolute bottom-3 right-3" style="z-index:100;">
	<!-- Hover area wrapper: p-3 expands hover target, -m-3 cancels layout shift -->
	<div class="p-3 -m-3 group/palette">
		<button
			bind:this={buttonEl}
			class="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300
				text-xs text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer
				{isOpen || canvasEmpty ? 'opacity-100' : 'opacity-35'} group-hover/palette:opacity-100
				transition-opacity duration-200"
			onclick={() => (isOpen = !isOpen)}
		>
			<span>Elements</span>
			{#if unplacedCount > 0}
				<span class="bg-gray-700 text-white text-[10px] px-1 rounded-sm">{unplacedCount}</span>
			{/if}
		</button>
	</div>

	<!-- Popover (opens above button) -->
	{#if isOpen}
		<div
			bind:this={popoverEl}
			class="absolute bottom-full right-0 mb-1.5 w-52 bg-white
				border border-gray-300 shadow-md max-h-64 overflow-y-auto"
		>
			<div class="p-2 space-y-0.5">
				<p class="text-[10px] text-gray-400 uppercase tracking-wider px-1 pb-1">Drag to canvas</p>
				{#each paletteElements as el (el.name)}
					{@const color = ELEMENT_COLORS[el.name]}
					{@const isDisabled = disabledElements.includes(el.name)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flex items-center gap-2 px-2 py-1.5 text-xs
							{isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:bg-gray-50'}"
						draggable={!isDisabled}
						ondragstart={(e) => handleDragStart(e, el.name)}
						ondragend={handleDragEnd}
					>
						<span class="w-3 h-3 shrink-0 rounded-sm" style="background:{color};"></span>
						<span class="min-w-0 truncate">
							{el.name}
							<span class="text-gray-400">({ELEMENT_LABELS[el.name]})</span>
						</span>
					</div>
				{/each}
				{#if paletteElements.length === 0}
					<p class="text-xs text-gray-400 italic px-1 py-2">All elements placed</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
