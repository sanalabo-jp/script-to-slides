<script lang="ts">
	import type { SlideTemplate, TemplateElement, ElementName } from '$lib/types';
	import { clampPosition } from '$lib/templates/layoutUtils';
	import LayoutCanvas from './LayoutCanvas.svelte';
	import LayoutPalettePopover from './LayoutPalettePopover.svelte';
	import LayoutPropertyPanel from './LayoutPropertyPanel.svelte';

	interface Props {
		initialTemplate: SlideTemplate;
		disabledElements?: ElementName[];
		onChange: (template: SlideTemplate) => void;
	}

	let { initialTemplate, disabledElements = [], onChange }: Props = $props();

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

	function handleDropElement(name: ElementName, x: number, y: number) {
		const el = template.elements.find((e) => e.name === name);
		if (!el) return;
		const clamped = clampPosition(x, y, el.layout.size.w, el.layout.size.h);
		handleUpdateElement(name, {
			...el,
			enabled: true,
			layout: { ...el.layout, position: clamped }
		});
	}

	function handleRemoveElement(name: ElementName) {
		const el = template.elements.find((e) => e.name === name);
		if (!el) return;
		handleUpdateElement(name, { ...el, enabled: false });
		if (selectedElement === name) selectedElement = null;
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

	<!-- Canvas + Popover wrapper -->
	<div class="relative">
		<LayoutCanvas
			elements={template.elements}
			{selectedElement}
			{snapEnabled}
			onSelectElement={handleSelectElement}
			onUpdateElement={handleUpdateElement}
			onDropElement={handleDropElement}
			onRemoveElement={handleRemoveElement}
		/>
		<LayoutPalettePopover elements={template.elements} {disabledElements} />
	</div>

	<!-- Property Panel (horizontal, below canvas) -->
	<LayoutPropertyPanel
		element={selectedEl}
		elementCount={template.elements.length}
		onUpdateElement={handleUpdateElement}
	/>
</div>
