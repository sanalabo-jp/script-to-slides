<script lang="ts">
	import type { TemplateElement, ElementName } from '$lib/types';
	import { SLIDE_WIDTH, SLIDE_HEIGHT, ELEMENT_COLORS, toPixel } from '$lib/templates/layoutUtils';

	interface Props {
		elements: TemplateElement[];
		selectedElement: ElementName | null;
		onSelectElement: (name: ElementName | null) => void;
		onUpdateElement: (name: ElementName, element: TemplateElement) => void;
	}

	let { elements, selectedElement, onSelectElement, onUpdateElement }: Props = $props();

	let canvasEl: HTMLDivElement | undefined = $state();
	let canvasWidth = $state(0);

	let scale = $derived(canvasWidth > 0 ? canvasWidth / SLIDE_WIDTH : 0);

	$effect(() => {
		if (!canvasEl) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				canvasWidth = entry.contentRect.width;
			}
		});
		observer.observe(canvasEl);
		return () => observer.disconnect();
	});

	function enabledElements(): TemplateElement[] {
		return elements.filter((el) => el.enabled !== false);
	}

	function handleCanvasClick() {
		onSelectElement(null);
	}

	function handleElementClick(e: MouseEvent, name: ElementName) {
		e.stopPropagation();
		onSelectElement(name);
	}
</script>

<div
	bind:this={canvasEl}
	class="relative w-full aspect-[1333/750] bg-gray-100 border border-gray-300 overflow-hidden select-none"
	role="presentation"
	onclick={handleCanvasClick}
>
	{#if scale > 0}
		{#each enabledElements() as el (el.name)}
			{@const isSelected = selectedElement === el.name}
			{@const color = ELEMENT_COLORS[el.name]}
			{@const left = toPixel(el.layout.position.x, scale)}
			{@const top = toPixel(el.layout.position.y, scale)}
			{@const width = toPixel(el.layout.size.w, scale)}
			{@const height = toPixel(el.layout.size.h, scale)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute flex items-start justify-start"
				style="left:{left}px;top:{top}px;width:{width}px;height:{height}px;
					background:{color}20;
					border:{isSelected ? '2px solid' : '1px dashed'} {color};
					z-index:{el.layout.zIndex};
					cursor:move;"
				onpointerdown={(e) => handleElementClick(e, el.name)}
			>
				<span
					class="px-0.5 text-white leading-none select-none pointer-events-none"
					style="font-size:{Math.max(9, Math.min(11, scale * 0.8))}px;background:{color};"
				>
					{el.name}
				</span>
			</div>
		{/each}
	{/if}
</div>
