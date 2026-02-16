<script lang="ts">
	import type { TemplateElement, ElementName, ElementLayout } from '$lib/types';
	import {
		SLIDE_WIDTH,
		SLIDE_HEIGHT,
		ELEMENT_COLORS,
		MIN_ELEMENT_SIZE,
		toPixel,
		toInch,
		clampPosition,
		clampSize,
		snapToGrid,
		DEFAULT_GRID_SIZE,
		computeOverlaps
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

	type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

	type DragState = {
		mode: 'move' | 'resize';
		elementName: ElementName;
		resizeHandle?: ResizeHandle;
		startPointer: { x: number; y: number };
		startLayout: ElementLayout;
	};

	let dragState: DragState | null = $state(null);

	const HANDLE_SIZE = 8; // px
	const RESIZE_HANDLES: { handle: ResizeHandle; cursor: string }[] = [
		{ handle: 'nw', cursor: 'nwse-resize' },
		{ handle: 'n', cursor: 'ns-resize' },
		{ handle: 'ne', cursor: 'nesw-resize' },
		{ handle: 'w', cursor: 'ew-resize' },
		{ handle: 'e', cursor: 'ew-resize' },
		{ handle: 'sw', cursor: 'nesw-resize' },
		{ handle: 's', cursor: 'ns-resize' },
		{ handle: 'se', cursor: 'nwse-resize' }
	];

	function handleStyle(handle: ResizeHandle, width: number, height: number): string {
		const half = HANDLE_SIZE / 2;
		let left = 0;
		let top = 0;
		if (handle.includes('w')) left = -half;
		else if (handle.includes('e')) left = width - half;
		else left = width / 2 - half;
		if (handle.includes('n')) top = -half;
		else if (handle.includes('s')) top = height - half;
		else top = height / 2 - half;
		return `left:${left}px;top:${top}px;width:${HANDLE_SIZE}px;height:${HANDLE_SIZE}px;`;
	}

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

	function maybeSnap(value: number): number {
		return snapEnabled ? snapToGrid(value, DEFAULT_GRID_SIZE) : value;
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

	// --- Drag: Resize ---

	function handleResizeDown(e: PointerEvent, name: ElementName, handle: ResizeHandle) {
		e.stopPropagation();
		e.preventDefault();

		const el = findElement(name);
		if (!el) return;

		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);

		dragState = {
			mode: 'resize',
			elementName: name,
			resizeHandle: handle,
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

		const dxInch = toInch(e.clientX - dragState.startPointer.x, scale);
		const dyInch = toInch(e.clientY - dragState.startPointer.y, scale);

		const el = findElement(dragState.elementName);
		if (!el) return;

		if (dragState.mode === 'move') {
			const newX = maybeSnap(dragState.startLayout.position.x + dxInch);
			const newY = maybeSnap(dragState.startLayout.position.y + dyInch);
			const clamped = clampPosition(newX, newY, el.layout.size.w, el.layout.size.h);

			onUpdateElement(dragState.elementName, {
				...el,
				layout: { ...el.layout, position: clamped }
			});
		} else if (dragState.mode === 'resize' && dragState.resizeHandle) {
			const h = dragState.resizeHandle;
			const sl = dragState.startLayout;
			const minSize = MIN_ELEMENT_SIZE[dragState.elementName];

			let x = sl.position.x;
			let y = sl.position.y;
			let w = sl.size.w;
			let hh = sl.size.h;

			// Horizontal
			if (h.includes('e')) {
				w = maybeSnap(sl.size.w + dxInch);
			} else if (h.includes('w')) {
				const newW = sl.size.w - dxInch;
				w = maybeSnap(newW);
				x = maybeSnap(sl.position.x + (sl.size.w - w));
			}

			// Vertical
			if (h.includes('s')) {
				hh = maybeSnap(sl.size.h + dyInch);
			} else if (h.includes('n')) {
				const newH = sl.size.h - dyInch;
				hh = maybeSnap(newH);
				y = maybeSnap(sl.position.y + (sl.size.h - hh));
			}

			// Apply constraints
			const cSize = clampSize(w, hh, minSize.w, minSize.h);
			// Recalculate position if size was clamped (for n/w handles)
			if (h.includes('w') && cSize.w !== w) {
				x = sl.position.x + sl.size.w - cSize.w;
			}
			if (h.includes('n') && cSize.h !== hh) {
				y = sl.position.y + sl.size.h - cSize.h;
			}
			const cPos = clampPosition(x, y, cSize.w, cSize.h);

			onUpdateElement(dragState.elementName, {
				...el,
				layout: { ...el.layout, position: cPos, size: cSize }
			});
		}
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
					background:{color}CC;
					border:{isSelected ? '2px solid' : '1px dashed'} {color};
					z-index:{el.layout.zIndex};
					cursor:{dragState?.mode === 'resize' ? 'auto' : 'move'};"
				onpointerdown={(e) => handlePointerDown(e, el.name)}
				onclick={(e) => e.stopPropagation()}
			>
				<span
					class="px-0.5 text-white leading-none select-none pointer-events-none"
					style="font-size:{Math.max(9, Math.min(11, scale * 0.8))}px;background:{color};"
				>
					{el.name}
				</span>

				<span
					class="absolute bottom-0 left-0 px-0.5 text-white leading-none select-none pointer-events-none opacity-70"
					style="font-size:{Math.max(8, Math.min(10, scale * 0.7))}px;background:{color};"
				>
					{el.layout.zIndex}
				</span>

				{#if isSelected}
					{#each RESIZE_HANDLES as { handle, cursor }}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute bg-white border border-gray-500"
							style="{handleStyle(handle, width, height)}cursor:{cursor};z-index:999;"
							onpointerdown={(e) => handleResizeDown(e, el.name, handle)}
							onclick={(e) => e.stopPropagation()}
						></div>
					{/each}
				{/if}
			</div>
		{/each}

		<!-- Overlap hatching layer -->
		{@const overlaps = computeOverlaps(elements)}
		{#each overlaps as rect}
			<div
				class="absolute pointer-events-none"
				style="left:{toPixel(rect.x, scale)}px;top:{toPixel(rect.y, scale)}px;
					width:{toPixel(rect.w, scale)}px;height:{toPixel(rect.h, scale)}px;
					z-index:998;
					background:repeating-linear-gradient(45deg,
						transparent, transparent 3px,
						rgba(239,68,68,0.3) 3px, rgba(239,68,68,0.3) 5px);"
			></div>
		{/each}
	{/if}
</div>
