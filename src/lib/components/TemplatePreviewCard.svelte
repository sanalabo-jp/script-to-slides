<script lang="ts">
	import type { SlideTemplate } from '$lib/types';

	let {
		template,
		isSelected = false,
		onClick,
		class: className = ''
	}: {
		template: SlideTemplate;
		isSelected?: boolean;
		onClick?: () => void;
		class?: string;
	} = $props();
</script>

<button
	class="group relative border p-3 transition-all text-left
		{isSelected ? 'border-gray-900 border-2' : 'border-gray-200 hover:border-gray-400'}
		{className}"
	onclick={onClick}
>
	<!-- Template preview (4:3) -->
	<div
		class="w-full aspect-[4/3] mb-2 border border-gray-100 flex items-center justify-center overflow-hidden"
		style="background-color: {template.background.color}"
	>
		<div class="w-4/5 space-y-1.5 p-2">
			<div
				class="h-1.5 w-3/5 opacity-60"
				style="background-color: {template.styles.callout1Label.fontColor}"
			></div>
			<div
				class="h-2.5 w-4/5"
				style="background-color: {template.styles.titleLabel.fontColor}"
			></div>
			<div class="space-y-1 pt-1">
				<div
					class="h-1.5 w-full opacity-40"
					style="background-color: {template.styles.bodyLabel.fontColor}"
				></div>
				<div
					class="h-1.5 w-3/4 opacity-40"
					style="background-color: {template.styles.bodyLabel.fontColor}"
				></div>
			</div>
		</div>
	</div>

	<!-- Template info -->
	<p class="text-xs font-medium text-gray-800">{template.name}</p>
	<p class="text-xs text-gray-500 mt-0.5">{template.description}</p>

	<!-- Selection indicator -->
	{#if isSelected}
		<div class="absolute top-1.5 right-1.5 text-xs text-gray-900 font-bold">[*]</div>
	{/if}
</button>
