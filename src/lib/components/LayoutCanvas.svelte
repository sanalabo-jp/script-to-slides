<script lang="ts">
	import type { TemplateElement, ElementName, ElementLayout } from '$lib/types';
	import {
		SLIDE_WIDTH,
		ELEMENT_COLORS,
		toPixel,
		toInch,
		clampPosition,
		snapToGrid,
		DEFAULT_GRID_SIZE
	} from '$lib/templates/layoutUtils';

	interface Props {
		elements: TemplateElement[];
		selectedElement: ElementName | null;
		snapEnabled: boolean;
		onSelectElement: (name: ElementName | null) => void;
		onUpdateElement: (name: ElementName, element: TemplateElement) => void;
	}

	let { elements, selectedElement, snapEnabled, onSelectElement, onUpdateElement }: Props =
		$props();

	let canvasEl: HTMLDivElement | undefined = $state();
	let canvasWidth = $state(0);

	let scale = $derived(canvasWidth > 0 ? canvasWidth / SLIDE_WIDTH : 0);

	// --- Drag state ---

	type DragState = {
		mode: 'move';
		elementName: ElementName;
		startPointer: { x: number; y: number };
		startLayout: ElementLayout;
	};

	let dragState: DragState | null = $state(null);

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

	function findElement(name: ElementName): TemplateElement | undefined {
		return elements.find((el) => el.name === name);
	}

	// --- Drag: Move ---

	function handlePointerDown(e: PointerEvent, name: ElementName) {
		e.stopPropagation();
		e.preventDefault();
		onSelectElement(name);

		const el = findElement(name);
		if (!el) return;

		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);

		dragState = {
			mode: 'move',
			elementName: name,
			startPointer: { x: e.clientX, y: e.clientY },
			startLayout: {
				position: { ...el.layout.position },
				size: { ...el.layout.size },
				zIndex: el.layout.zIndex
			}
		};
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragState || scale === 0) return;

		const dx = e.clientX - dragState.startPointer.x;
		const dy = e.clientY - dragState.startPointer.y;

		const dxInch = toInch(dx, scale);
		const dyInch = toInch(dy, scale);

		const el = findElement(dragState.elementName);
		if (!el) return;

		let newX = dragState.startLayout.position.x + dxInch;
		let newY = dragState.startLayout.position.y + dyInch;

		if (snapEnabled) {
			newX = snapToGrid(newX, DEFAULT_GRID_SIZE);
			newY = snapToGrid(newY, DEFAULT_GRID_SIZE);
		}

		const clamped = clampPosition(newX, newY, el.layout.size.w, el.layout.size.h);

		const updated: TemplateElement = {
			...el,
			layout: {
				...el.layout,
				position: clamped
			}
		};
		onUpdateElement(dragState.elementName, updated);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!dragState) return;
		const target = e.currentTarget as HTMLElement;
		target.releasePointerCapture(e.pointerId);
		dragState = null;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={canvasEl}
	class="relative w-full aspect-[1333/750] bg-gray-100 border border-gray-300 overflow-hidden select-none"
	onclick={handleCanvasClick}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
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
				onpointerdown={(e) => handlePointerDown(e, el.name)}
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
