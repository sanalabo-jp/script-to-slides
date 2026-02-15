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
		onUpdateElement: (name: ElementName, element: TemplateElement) => void;
	}

	let { element, onUpdateElement }: Props = $props();

	function updatePosition(axis: 'x' | 'y', value: number) {
		if (!element) return;
		const pos = { ...element.layout.position, [axis]: value };
		const clamped = clampPosition(pos.x, pos.y, element.layout.size.w, element.layout.size.h);
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, position: clamped }
		});
	}

	function updateSize(axis: 'w' | 'h', value: number) {
		if (!element) return;
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
	}

	function updateZIndex(value: number) {
		if (!element) return;
		const z = Math.max(0, Math.min(10, Math.round(value)));
		onUpdateElement(element.name, {
			...element,
			layout: { ...element.layout, zIndex: z }
		});
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
					onchange={(e) =>
						updatePosition('x', parseFloat((e.target as HTMLInputElement).value) || 0)}
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
					onchange={(e) =>
						updatePosition('y', parseFloat((e.target as HTMLInputElement).value) || 0)}
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
					onchange={(e) => updateSize('w', parseFloat((e.target as HTMLInputElement).value) || 0)}
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
					onchange={(e) => updateSize('h', parseFloat((e.target as HTMLInputElement).value) || 0)}
					class="w-full mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
				/>
			</label>
		</div>

		<label class="text-xs text-gray-500 block">
			zIndex
			<input
				type="number"
				step="1"
				min="0"
				max="10"
				value={element.layout.zIndex}
				onchange={(e) => updateZIndex(parseInt((e.target as HTMLInputElement).value) || 0)}
				class="w-20 mt-0.5 px-1.5 py-0.5 border border-gray-300 text-xs font-mono"
			/>
		</label>
	</div>
{:else}
	<p class="text-xs text-gray-400 italic">Select an element to edit its properties</p>
{/if}
