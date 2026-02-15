<script lang="ts">
	import type { TemplateElement, ElementName } from '$lib/types';
	import { ELEMENT_COLORS } from '$lib/templates/layoutUtils';

	interface Props {
		elements: TemplateElement[];
		selectedElement: ElementName | null;
		onSelectElement: (name: ElementName | null) => void;
		onToggleElement: (name: ElementName, enabled: boolean) => void;
	}

	let { elements, selectedElement, onSelectElement, onToggleElement }: Props = $props();

	const ELEMENT_LABELS: Record<ElementName, string> = {
		callout1: 'metadata',
		callout2: 'speaker',
		title: 'summary',
		body: 'context',
		image: 'image',
		caption: 'detail'
	};
</script>

<div class="space-y-1">
	<p class="text-xs text-gray-500 mb-1">Elements</p>
	{#each elements as el (el.name)}
		{@const isEnabled = el.enabled !== false}
		{@const isSelected = selectedElement === el.name}
		{@const color = ELEMENT_COLORS[el.name]}
		<button
			class="w-full flex items-center gap-2 px-2 py-1 text-xs text-left transition-colors
				{isSelected ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}"
			onclick={() => onSelectElement(isSelected ? null : el.name)}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<input
				type="checkbox"
				checked={isEnabled}
				class="accent-gray-700"
				onclick={(e: MouseEvent) => {
					e.stopPropagation();
					onToggleElement(el.name, !isEnabled);
				}}
			/>
			<span class="inline-block w-3 h-3 shrink-0 rounded-sm" style="background:{color};"></span>
			<span class="min-w-0 truncate">
				{el.name}
				<span class="text-gray-400">({ELEMENT_LABELS[el.name]})</span>
			</span>
		</button>
	{/each}
</div>
