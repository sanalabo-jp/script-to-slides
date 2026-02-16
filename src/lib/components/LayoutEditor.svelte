<script lang="ts">
	import type { SlideTemplate, TemplateElement, ElementName } from '$lib/types';
	import LayoutCanvas from './LayoutCanvas.svelte';
	import LayoutPropertyPanel from './LayoutPropertyPanel.svelte';

	interface Props {
		initialTemplate: SlideTemplate;
		onChange: (template: SlideTemplate) => void;
	}

	let { initialTemplate, onChange }: Props = $props();

	// Deep clone to avoid mutating the original
	let template: SlideTemplate = $state(structuredClone($state.snapshot(initialTemplate)));

	let selectedElement: ElementName | null = $state(null);
	let snapEnabled = $state(true);

	let selectedEl = $derived(
		selectedElement ? (template.elements.find((el) => el.name === selectedElement) ?? null) : null
	);

	function handleSelectElement(name: ElementName | null) {
		selectedElement = name;
	}

	function handleUpdateElement(name: ElementName, updated: TemplateElement) {
		template = {
			...template,
			elements: template.elements.map((el) => (el.name === name ? updated : el))
		};
		onChange(structuredClone($state.snapshot(template)));
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-base font-semibold text-gray-800">Layout Editor</h3>
		<label class="flex items-center gap-1.5 text-xs text-gray-600">
			<input type="checkbox" bind:checked={snapEnabled} class="accent-gray-700" />
			Snap to grid (0.1&quot;)
		</label>
	</div>

	<!-- Canvas (full width) -->
	<div class="relative">
		<LayoutCanvas
			elements={template.elements}
			{selectedElement}
			{snapEnabled}
			onSelectElement={handleSelectElement}
			onUpdateElement={handleUpdateElement}
		/>
	</div>

	<!-- Property Panel (horizontal, below canvas) -->
	<LayoutPropertyPanel
		element={selectedEl}
		elementCount={template.elements.length}
		onUpdateElement={handleUpdateElement}
	/>
</div>
