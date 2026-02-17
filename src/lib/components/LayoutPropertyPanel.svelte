<script lang="ts">
	import type { TemplateElement, ElementName } from '$lib/types';
	import {
		SLIDE_WIDTH,
		SLIDE_HEIGHT,
		MIN_ELEMENT_SIZE,
		DEFAULT_GRID_SIZE,
		clampPosition,
		clampSize
	} from '$lib/templates/layoutUtils';

	interface Props {
		element: TemplateElement | null;
		enabledCount: number;
		onUpdateElement: (name: ElementName, element: TemplateElement) => void;
	}

	let { element, enabledCount, onUpdateElement }: Props = $props();

	let maxZIndex = $derived(Math.max(1, enabledCount));

	const SNAP_PRESETS = [
		{ label: 'off', value: 0 },
		{ label: '.05', value: 0.05 },
		{ label: '.1', value: 0.1 },
		{ label: '.25', value: 0.25 }
	];

	let currentGridSize = $derived(element?.layout.gridSize ?? DEFAULT_GRID_SIZE);

	function updatePosition(axis: 'x' | 'y', value: number): number {
		if (!element) return value;
		const pos = { ...element.layout.position, [axis]: value };
		const clamped = clampPosition(pos.x, pos.y, element.layout.size.w, element.layout.size.h);
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, position: clamped }
		});
		return axis === 'x' ? clamped.x : clamped.y;
	}

	function updateSize(axis: 'w' | 'h', value: number): number {
		if (!element) return value;
		const minSize = MIN_ELEMENT_SIZE[element.name];
		const size = { ...element.layout.size, [axis]: value };
		const clamped = clampSize(size.w, size.h, minSize.w, minSize.h);
		const pos = clampPosition(
			element.layout.position.x,
			element.layout.position.y,
			clamped.w,
			clamped.h
		);
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, position: pos, size: clamped }
		});
		return axis === 'w' ? clamped.w : clamped.h;
	}

	function updateZIndex(value: number): number {
		if (!element) return value;
		const z = Math.max(1, Math.min(maxZIndex, Math.round(value)));
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, zIndex: z }
		});
		return z;
	}

	function updateGridSize(value: number) {
		if (!element) return;
		const gs = Math.max(0, Math.min(1, value));
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, gridSize: gs }
		});
	}

	function handleChange(
		e: Event,
		updater: (value: number) => number,
		parser: (s: string) => number
	) {
		const input = e.target as HTMLInputElement;
		const result = updater(parser(input.value) || 0);
		input.value = String(result);
	}
</script>

<div class="h-20 overflow-y-auto border border-gray-200 px-3 py-2">
	<!-- Header (always visible) -->
	<div class="flex items-center mb-2">
		<span class="text-[10px] text-gray-400 uppercase tracking-wider">Properties</span>
	</div>

	<!-- Element properties or placeholder -->
	{#if element}
		<div class="flex items-center gap-3 flex-wrap">
			<p class="text-xs text-gray-500 shrink-0">
				<span class="font-semibold text-gray-700">{element.name}</span>
			</p>
			<label class="flex items-center gap-1 text-xs text-gray-500">
				x
				<input
					type="number"
					step="0.05"
					min="0"
					max={SLIDE_WIDTH}
					value={element.layout.position.x}
					onchange={(e) => handleChange(e, (v) => updatePosition('x', v), parseFloat)}
					class="w-16 px-1 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="flex items-center gap-1 text-xs text-gray-500">
				y
				<input
					type="number"
					step="0.05"
					min="0"
					max={SLIDE_HEIGHT}
					value={element.layout.position.y}
					onchange={(e) => handleChange(e, (v) => updatePosition('y', v), parseFloat)}
					class="w-16 px-1 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="flex items-center gap-1 text-xs text-gray-500">
				w
				<input
					type="number"
					step="0.05"
					min={MIN_ELEMENT_SIZE[element.name].w}
					max={SLIDE_WIDTH}
					value={element.layout.size.w}
					onchange={(e) => handleChange(e, (v) => updateSize('w', v), parseFloat)}
					class="w-16 px-1 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="flex items-center gap-1 text-xs text-gray-500">
				h
				<input
					type="number"
					step="0.05"
					min={MIN_ELEMENT_SIZE[element.name].h}
					max={SLIDE_HEIGHT}
					value={element.layout.size.h}
					onchange={(e) => handleChange(e, (v) => updateSize('h', v), parseFloat)}
					class="w-16 px-1 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="flex items-center gap-1 text-xs text-gray-500">
				z
				<input
					type="number"
					step="1"
					min="1"
					max={maxZIndex}
					value={element.layout.zIndex}
					onchange={(e) => handleChange(e, updateZIndex, parseInt)}
					class="w-12 px-1 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<span class="flex items-center gap-1 text-xs text-gray-500 shrink-0">
				snap
				{#each SNAP_PRESETS as preset}
					<button
						class="px-1 py-0.5 text-[10px] font-mono border cursor-pointer {currentGridSize ===
						preset.value
							? 'bg-gray-700 text-white border-gray-700'
							: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}"
						onclick={() => updateGridSize(preset.value)}
					>
						{preset.label}
					</button>
				{/each}
				<input
					type="number"
					step="0.01"
					min="0"
					max="1"
					value={currentGridSize}
					onchange={(e) => {
						const v = parseFloat((e.target as HTMLInputElement).value) || 0;
						updateGridSize(v);
					}}
					class="w-14 px-1 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</span>
		</div>
	{:else}
		<p class="text-xs text-gray-400 italic">Select an element to edit its properties</p>
	{/if}
</div>
