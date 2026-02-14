<script lang="ts">
	import type { SlideTemplate } from '$lib/types';
	import { templatePresets } from '$lib/templates/presets';
	import TemplatePreviewCard from './TemplatePreviewCard.svelte';
	import TemplateTooltip from './TemplateTooltip.svelte';

	let {
		selectedTemplate,
		onSelect
	}: {
		selectedTemplate: SlideTemplate | null;
		onSelect: (template: SlideTemplate) => void;
	} = $props();

	let tooltipTemplate: SlideTemplate | null = $state(null);
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function handleMouseEnter(template: SlideTemplate) {
		tooltipTemplate = template;
		tooltipVisible = true;
	}

	function handleMouseMove(e: MouseEvent) {
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}

	function handleMouseLeave() {
		tooltipVisible = false;
		tooltipTemplate = null;
	}
</script>

<div class="t-card overflow-hidden">
	<div class="px-4 py-3 border-b border-gray-200">
		<h2 class="text-base font-semibold text-gray-800 mb-1">Select Template</h2>
		<p class="text-xs text-gray-500">Choose a design template for your presentation</p>
	</div>

	<div class="p-4 grid grid-cols-3 gap-3">
		{#each templatePresets as template}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onmouseenter={() => handleMouseEnter(template)}
				onmousemove={handleMouseMove}
				onmouseleave={handleMouseLeave}
			>
				<TemplatePreviewCard
					{template}
					isSelected={selectedTemplate?.id === template.id}
					onClick={() => onSelect(template)}
				/>
			</div>
		{/each}
	</div>
</div>

<TemplateTooltip template={tooltipTemplate} visible={tooltipVisible} x={tooltipX} y={tooltipY} />
