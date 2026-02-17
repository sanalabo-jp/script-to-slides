<script lang="ts">
	import type { SlideTemplate, ElementName } from '$lib/types';
	import {
		deriveSecondaryFontStyle,
		isValidHexColor,
		FONT_FAMILY_PRESETS,
		FONT_WEIGHT_OPTIONS
	} from '$lib/templates/templateUtils';

	let {
		initialTemplate,
		onChange
	}: {
		initialTemplate: SlideTemplate;
		onChange: (template: SlideTemplate) => void;
	} = $props();

	// Deep clone for editing — $state.snapshot unwraps Svelte 5 proxy before cloning
	let template: SlideTemplate = $state(structuredClone($state.snapshot(initialTemplate)));
	let autoDerive = $state(true);

	// Editable elements (all except 'image')
	type EditableElement = Exclude<ElementName, 'image'>;
	let customFontMode: Record<EditableElement, boolean> = $state({
		callout1: false,
		callout2: false,
		title: false,
		body: false,
		caption: false
	});

	const editEntries: { name: EditableElement; label: string }[] = [
		{ name: 'callout1', label: 'Callout 1' },
		{ name: 'callout2', label: 'Callout 2' },
		{ name: 'title', label: 'Title' },
		{ name: 'body', label: 'Body' },
		{ name: 'caption', label: 'Caption' }
	];

	function getElementIndex(name: ElementName): number {
		return template.elements.findIndex((e) => e.name === name);
	}

	// Auto-derive callout2 secondary style from primary
	$effect(() => {
		if (autoDerive) {
			const idx = getElementIndex('callout2');
			if (idx >= 0 && template.elements[idx].styles[0]) {
				const primary = template.elements[idx].styles[0];
				// Read all fields to track dependencies
				void (primary.fontFamily + primary.fontSize + primary.fontColor + primary.fontWeight);
				template.elements[idx].styles[1] = deriveSecondaryFontStyle(primary);
			}
		}
	});

	// Notify parent on every change
	$effect(() => {
		// Read all template fields to track
		void template.name;
		void template.description;
		void template.background.color;
		for (const el of template.elements) {
			for (const s of el.styles) {
				void (s.fontFamily + s.fontSize + s.fontColor + s.fontWeight);
			}
		}
		onChange($state.snapshot(template));
	});

	function handleFontFamilyChange(name: EditableElement, value: string) {
		if (value === '__custom__') {
			customFontMode[name] = true;
		} else {
			customFontMode[name] = false;
			const idx = getElementIndex(name);
			if (idx >= 0) template.elements[idx].styles[0].fontFamily = value;
		}
	}

	function isFontInPresets(font: string): boolean {
		return FONT_FAMILY_PRESETS.includes(font);
	}
</script>

<div class="space-y-4">
	<!-- Template Name -->
	<div class="space-y-1">
		<label class="text-[10px] text-gray-400 uppercase tracking-wider">Template Name</label>
		<input
			type="text"
			class="w-full text-xs px-2 py-1.5 t-input-border bg-transparent"
			bind:value={template.name}
		/>
	</div>

	<!-- Description -->
	<div class="space-y-1">
		<label class="text-[10px] text-gray-400 uppercase tracking-wider">Description</label>
		<input
			type="text"
			class="w-full text-xs px-2 py-1.5 t-input-border bg-transparent"
			placeholder="Template description (optional)"
			bind:value={template.description}
		/>
	</div>

	<!-- Background Color -->
	<div class="space-y-1">
		<label class="text-[10px] text-gray-400 uppercase tracking-wider">Background</label>
		<div class="flex items-center gap-2">
			<input
				type="color"
				class="w-8 h-8 border border-gray-200 cursor-pointer p-0"
				bind:value={template.background.color}
			/>
			<input
				type="text"
				class="text-xs px-2 py-1.5 t-input-border bg-transparent w-24"
				value={template.background.color}
				oninput={(e) => {
					const v = (e.target as HTMLInputElement).value;
					if (isValidHexColor(v)) template.background.color = v;
				}}
			/>
		</div>
	</div>

	<!-- Style sections -->
	{#each editEntries as { name, label }}
		{@const idx = getElementIndex(name)}
		{@const style = template.elements[idx]?.styles[0]}
		{@const isCallout2 = name === 'callout2'}

		{#if style}
			<div class="space-y-1.5">
				<div class="flex items-center gap-2">
					<span class="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
					{#if isCallout2}
						<label class="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
							<input type="checkbox" bind:checked={autoDerive} class="accent-gray-900" />
							auto-derive role
						</label>
					{/if}
				</div>

				<div class="grid grid-cols-4 gap-2">
					<!-- Font Family -->
					<div class="col-span-2">
						{#if customFontMode[name] || !isFontInPresets(style.fontFamily)}
							<div class="flex items-center gap-1">
								<input
									type="text"
									class="text-xs px-2 py-1 t-input-border bg-transparent w-full"
									placeholder="Font name..."
									bind:value={template.elements[idx].styles[0].fontFamily}
								/>
								<button
									class="text-[10px] text-gray-400 hover:text-gray-700 shrink-0"
									onclick={() => {
										customFontMode[name] = false;
										if (!isFontInPresets(style.fontFamily)) {
											template.elements[idx].styles[0].fontFamily = FONT_FAMILY_PRESETS[0];
										}
									}}
								>
									[list]
								</button>
							</div>
						{:else}
							<select
								class="text-xs px-1 py-1 border border-gray-200 bg-white w-full"
								value={style.fontFamily}
								onchange={(e) =>
									handleFontFamilyChange(name, (e.target as HTMLSelectElement).value)}
							>
								{#each FONT_FAMILY_PRESETS as font}
									<option value={font}>{font}</option>
								{/each}
								<option value="__custom__">Custom...</option>
							</select>
						{/if}
					</div>

					<!-- Font Size -->
					<div>
						<input
							type="number"
							class="text-xs px-2 py-1 t-input-border bg-transparent w-full"
							min="6"
							max="72"
							bind:value={template.elements[idx].styles[0].fontSize}
						/>
					</div>

					<!-- Font Weight -->
					<div>
						<select
							class="text-xs px-1 py-1 border border-gray-200 bg-white w-full"
							value={style.fontWeight}
							onchange={(e) => {
								template.elements[idx].styles[0].fontWeight = Number(
									(e.target as HTMLSelectElement).value
								);
							}}
						>
							{#each FONT_WEIGHT_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Font Color -->
				<div class="flex items-center gap-2">
					<input
						type="color"
						class="w-6 h-6 border border-gray-200 cursor-pointer p-0"
						bind:value={template.elements[idx].styles[0].fontColor}
					/>
					<input
						type="text"
						class="text-xs px-2 py-1 t-input-border bg-transparent w-24"
						value={style.fontColor}
						oninput={(e) => {
							const v = (e.target as HTMLInputElement).value;
							if (isValidHexColor(v)) template.elements[idx].styles[0].fontColor = v;
						}}
					/>
					<span class="text-[10px] text-gray-400">{style.fontSize}pt</span>
				</div>
			</div>
		{/if}
	{/each}
</div>
