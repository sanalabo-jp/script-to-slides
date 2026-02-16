<script lang="ts">
	import type { TemplateElement, ElementName } from '$lib/types';
	import {
		SLIDE_WIDTH,
		SLIDE_HEIGHT,
		MIN_ELEMENT_SIZE,
		clampPosition,
		clampSize
	} from '$lib/templates/layoutUtils';

	interface Props {
		element: TemplateElement | null;
		elementCount: number;
		onUpdateElement: (name: ElementName, element: TemplateElement) => void;
	}

	let { element, elementCount, onUpdateElement }: Props = $props();

	let maxZIndex = $derived(Math.max(1, elementCount));

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
		const z = Math.max(0, Math.min(maxZIndex, Math.round(value)));
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, zIndex: z }
		});
		return z;
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

{#if element}
	<div class="space-y-3">
		<p class="text-xs text-gray-500">
			Properties: <span class="font-semibold text-gray-700">{element.name}</span>
		</p>

		<div class="grid grid-cols-2 gap-2">
			<label class="text-xs text-gray-500">
				x (in)
				<input
					type="number"
					step="0.05"
					min="0"
					max={SLIDE_WIDTH}
					value={element.layout.position.x}
					onchange={(e) => handleChange(e, (v) => updatePosition('x', v), parseFloat)}
					class="w-full mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="text-xs text-gray-500">
				y (in)
				<input
					type="number"
					step="0.05"
					min="0"
					max={SLIDE_HEIGHT}
					value={element.layout.position.y}
					onchange={(e) => handleChange(e, (v) => updatePosition('y', v), parseFloat)}
					class="w-full mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="text-xs text-gray-500">
				w (in)
				<input
					type="number"
					step="0.05"
					min={MIN_ELEMENT_SIZE[element.name].w}
					max={SLIDE_WIDTH}
					value={element.layout.size.w}
					onchange={(e) => handleChange(e, (v) => updateSize('w', v), parseFloat)}
					class="w-full mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
			<label class="text-xs text-gray-500">
				h (in)
				<input
					type="number"
					step="0.05"
					min={MIN_ELEMENT_SIZE[element.name].h}
					max={SLIDE_HEIGHT}
					value={element.layout.size.h}
					onchange={(e) => handleChange(e, (v) => updateSize('h', v), parseFloat)}
					class="w-full mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
		</div>

		<label class="text-xs text-gray-500 block">
			zIndex (max {maxZIndex})
			<input
				type="number"
				step="1"
				min="0"
				max={maxZIndex}
				value={element.layout.zIndex}
				onchange={(e) => handleChange(e, updateZIndex, parseInt)}
				class="w-20 mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
			/>
		</label>
	</div>
{:else}
	<p class="text-xs text-gray-400 italic">Select an element to edit its properties</p>
{/if}
