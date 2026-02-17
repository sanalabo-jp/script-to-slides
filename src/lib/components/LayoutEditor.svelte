<script lang="ts">
	import type { SlideTemplate, TemplateElement, ElementName } from '$lib/types';
	import {
		clampPosition,
		getNextZIndex,
		normalizeZIndexes,
		reorderZIndex
	} from '$lib/templates/layoutUtils';
	import LayoutCanvas from './LayoutCanvas.svelte';
	import LayoutPalettePopover from './LayoutPalettePopover.svelte';
	import LayoutPropertyPanel from './LayoutPropertyPanel.svelte';

	interface Props {
		initialTemplate: SlideTemplate;
		disabledElements?: ElementName[];
		onChange: (template: SlideTemplate) => void;
	}

	let { initialTemplate, disabledElements = [], onChange }: Props = $props();

	// Deep clone + normalize z-indexes (handles legacy duplicate z-indexes)
	let template: SlideTemplate = $state(
		(() => {
			const cloned = structuredClone($state.snapshot(initialTemplate));
			return { ...cloned, elements: normalizeZIndexes(cloned.elements) };
		})()
	);

	let selectedElement: ElementName | null = $state(null);
	let snapEnabled = $state(true);

	let selectedEl = $derived(
		selectedElement ? (template.elements.find((el) => el.name === selectedElement) ?? null) : null
	);

	function handleSelectElement(name: ElementName | null) {
		selectedElement = name;
	}

	function handleUpdateElement(name: ElementName, updated: TemplateElement) {
		const existing = template.elements.find((el) => el.name === name);
		if (existing && existing.layout.zIndex !== updated.layout.zIndex) {
			// z-index changed: apply re-rank
			template = {
				...template,
				elements: reorderZIndex(
					template.elements.map((el) => (el.name === name ? updated : el)),
					name,
					updated.layout.zIndex
				)
			};
		} else {
			template = {
				...template,
				elements: template.elements.map((el) => (el.name === name ? updated : el))
			};
		}
		onChange(structuredClone($state.snapshot(template)));
	}

	function handleDropElement(name: ElementName, x: number, y: number) {
		const el = template.elements.find((e) => e.name === name);
		if (!el) return;
		const clamped = clampPosition(x, y, el.layout.size.w, el.layout.size.h);
		const nextZ = getNextZIndex(template.elements);
		const updated = template.elements.map((e) =>
			e.name === name
				? { ...e, enabled: true, layout: { ...e.layout, position: clamped, zIndex: nextZ } }
				: e
		);
		template = { ...template, elements: normalizeZIndexes(updated) };
		onChange(structuredClone($state.snapshot(template)));
	}

	function handleRemoveElement(name: ElementName) {
		const el = template.elements.find((e) => e.name === name);
		if (!el) return;
		const updated = template.elements.map((e) => (e.name === name ? { ...e, enabled: false } : e));
		template = { ...template, elements: normalizeZIndexes(updated) };
		onChange(structuredClone($state.snapshot(template)));
		if (selectedElement === name) selectedElement = null;
	}

	function handleBringToFront(name: ElementName) {
		const enabledCount = template.elements.filter((el) => el.enabled !== false).length;
		template = { ...template, elements: reorderZIndex(template.elements, name, enabledCount) };
		onChange(structuredClone($state.snapshot(template)));
	}

	function handleSendToBack(name: ElementName) {
		template = { ...template, elements: reorderZIndex(template.elements, name, 1) };
		onChange(structuredClone($state.snapshot(template)));
	}
</script>

<div class="space-y-3">
	<h3 class="text-base font-semibold text-gray-800">Layout Editor</h3>

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
			onBringToFront={handleBringToFront}
			onSendToBack={handleSendToBack}
		/>
		<LayoutPalettePopover elements={template.elements} {disabledElements} />
	</div>

	<!-- Property Panel (fixed height, below canvas) -->
	<LayoutPropertyPanel
		element={selectedEl}
		enabledCount={template.elements.filter((el) => el.enabled !== false).length}
		{snapEnabled}
		onUpdateElement={handleUpdateElement}
		onSnapToggle={(v) => {
			snapEnabled = v;
		}}
	/>
</div>
