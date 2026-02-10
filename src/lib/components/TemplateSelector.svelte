<script lang="ts">
  import type { SlideTemplate } from '$lib/types';
  import { templatePresets } from '$lib/templates/presets';

  let {
    selectedTemplate,
    onSelect,
  }: {
    selectedTemplate: SlideTemplate | null;
    onSelect: (template: SlideTemplate) => void;
  } = $props();
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-100">
    <h2 class="font-semibold text-gray-800">Select Template</h2>
    <p class="text-sm text-gray-500 mt-1">Choose a design template for your presentation</p>
  </div>

  <div class="p-6 grid grid-cols-3 gap-4">
    {#each templatePresets as template}
      {@const isSelected = selectedTemplate?.id === template.id}
      <button
        class="group relative rounded-lg border-2 p-4 transition-all text-left
          {isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
        onclick={() => onSelect(template)}
      >
        <!-- Template preview -->
        <div
          class="w-full aspect-[4/3] rounded-md mb-3 border border-gray-100 flex items-center justify-center overflow-hidden"
          style="background-color: {template.background.color}"
        >
          <div class="w-4/5 space-y-1.5 p-2">
            <div
              class="h-1.5 w-3/5 rounded-full opacity-60"
              style="background-color: {template.styles.callout1Label.fontColor}"
            ></div>
            <div
              class="h-2.5 w-4/5 rounded-sm"
              style="background-color: {template.styles.titleLabel.fontColor}"
            ></div>
            <div class="space-y-1 pt-1">
              <div
                class="h-1.5 w-full rounded-full opacity-40"
                style="background-color: {template.styles.bodyLabel.fontColor}"
              ></div>
              <div
                class="h-1.5 w-3/4 rounded-full opacity-40"
                style="background-color: {template.styles.bodyLabel.fontColor}"
              ></div>
            </div>
          </div>
        </div>

        <!-- Template info -->
        <p class="font-medium text-sm text-gray-800">{template.name}</p>
        <p class="text-xs text-gray-500 mt-0.5">{template.description}</p>

        <!-- Selection indicator -->
        {#if isSelected}
          <div class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>
