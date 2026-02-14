<script lang="ts">
	import type { SlideTemplate } from '$lib/types';

	let {
		template,
		visible,
		x,
		y
	}: {
		template: SlideTemplate | null;
		visible: boolean;
		x: number;
		y: number;
	} = $props();

	const OFFSET_X = 16;
	const OFFSET_Y = 16;

	function weightLabel(w: number): string {
		if (w >= 700) return 'Bold';
		if (w >= 500) return 'Medium';
		return 'Regular';
	}

	const styleEntries = [
		{ key: 'titleLabel' as const, label: 'title' },
		{ key: 'bodyLabel' as const, label: 'body' },
		{ key: 'callout1Label' as const, label: 'callout1' },
		{ key: 'callout2Label' as const, label: 'callout2' },
		{ key: 'captionLabel' as const, label: 'caption' }
	];
</script>

{#if visible && template}
	<div
		class="fixed z-50 pointer-events-none"
		style="left: {x + OFFSET_X}px; top: {y + OFFSET_Y}px;"
	>
		<div class="bg-white border border-gray-300 shadow-md p-3 min-w-56 max-w-72">
			<!-- Header -->
			<div class="text-xs font-semibold text-gray-800 mb-2 pb-1.5 border-b border-gray-200">
				{template.name}
			</div>

			<!-- Background -->
			<div class="flex items-center gap-2 mb-2">
				<div
					class="w-4 h-4 border border-gray-200 shrink-0"
					style="background-color: {template.background.color}"
				></div>
				<span class="text-[10px] text-gray-500">
					background {template.background.color}
				</span>
			</div>

			<!-- Style entries -->
			<div class="space-y-1.5">
				{#each styleEntries as { key, label }}
					{@const s = template.styles[key]}
					<div class="flex items-start gap-2">
						<div
							class="w-4 h-4 border border-gray-200 shrink-0 mt-0.5"
							style="background-color: {s.fontColor}"
						></div>
						<div class="text-[10px] leading-tight">
							<div class="text-gray-700 font-medium">{label}</div>
							<div class="text-gray-400">
								{s.fontFamily} / {s.fontSize}pt / {weightLabel(s.fontWeight)}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
