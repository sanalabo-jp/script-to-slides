<script lang="ts">
	import type { SlideTemplate, ElementStyle } from '$lib/types';
	import {
		deriveCallout2,
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

	// Track custom font input mode per style key
	type StyleKey = 'titleLabel' | 'bodyLabel' | 'callout1Label' | 'callout2Label' | 'captionLabel';
	let customFontMode: Record<StyleKey, boolean> = $state({
		titleLabel: false,
		bodyLabel: false,
		callout1Label: false,
		callout2Label: false,
		captionLabel: false
	});

	const styleEntries: { key: StyleKey; label: string }[] = [
		{ key: 'titleLabel', label: 'Title' },
		{ key: 'bodyLabel', label: 'Body' },
		{ key: 'callout1Label', label: 'Callout 1' },
		{ key: 'callout2Label', label: 'Callout 2' },
		{ key: 'captionLabel', label: 'Caption' }
	];

	// Auto-derive callout2 when callout1 changes
	$effect(() => {
		if (autoDerive) {
			const c1 = template.styles.callout1Label;
			// Read all fields to track dependencies
			void (c1.fontFamily + c1.fontSize + c1.fontColor + c1.fontWeight);
			template.styles.callout2Label = deriveCallout2(c1);
		}
	});

	// Notify parent on every change
	$effect(() => {
		// Read all template fields to track
		void template.name;
		void template.background.color;
		for (const { key } of styleEntries) {
			const s = template.styles[key];
			void (s.fontFamily + s.fontSize + s.fontColor + s.fontWeight);
		}
		onChange($state.snapshot(template));
	});

	function handleFontFamilyChange(key: StyleKey, value: string) {
		if (value === '__custom__') {
			customFontMode[key] = true;
		} else {
			customFontMode[key] = false;
			template.styles[key].fontFamily = value;
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
	{#each styleEntries as { key, label }}
		{@const style = template.styles[key]}
		{@const isCallout2 = key === 'callout2Label'}
		{@const disabled = isCallout2 && autoDerive}

		<div class="space-y-1.5 {disabled ? 'opacity-50' : ''}">
			<div class="flex items-center gap-2">
				<span class="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
				{#if isCallout2}
					<label class="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
						<input type="checkbox" bind:checked={autoDerive} class="accent-gray-900" />
						auto-derive
					</label>
				{/if}
			</div>

			<div class="grid grid-cols-4 gap-2">
				<!-- Font Family -->
				<div class="col-span-2">
					{#if customFontMode[key] || !isFontInPresets(style.fontFamily)}
						<div class="flex items-center gap-1">
							<input
								type="text"
								class="text-xs px-2 py-1 t-input-border bg-transparent w-full"
								placeholder="Font name..."
								bind:value={template.styles[key].fontFamily}
								{disabled}
							/>
							<button
								class="text-[10px] text-gray-400 hover:text-gray-700 shrink-0"
								onclick={() => {
									customFontMode[key] = false;
									if (!isFontInPresets(style.fontFamily)) {
										template.styles[key].fontFamily = FONT_FAMILY_PRESETS[0];
									}
								}}
								{disabled}
							>
								[list]
							</button>
						</div>
					{:else}
						<select
							class="text-xs px-1 py-1 border border-gray-200 bg-white w-full"
							value={style.fontFamily}
							onchange={(e) => handleFontFamilyChange(key, (e.target as HTMLSelectElement).value)}
							{disabled}
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
						bind:value={template.styles[key].fontSize}
						{disabled}
					/>
				</div>

				<!-- Font Weight -->
				<div>
					<select
						class="text-xs px-1 py-1 border border-gray-200 bg-white w-full"
						value={style.fontWeight}
						onchange={(e) => {
							template.styles[key].fontWeight = Number((e.target as HTMLSelectElement).value);
						}}
						{disabled}
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
					bind:value={template.styles[key].fontColor}
					{disabled}
				/>
				<input
					type="text"
					class="text-xs px-2 py-1 t-input-border bg-transparent w-24"
					value={style.fontColor}
					oninput={(e) => {
						const v = (e.target as HTMLInputElement).value;
						if (isValidHexColor(v)) template.styles[key].fontColor = v;
					}}
					{disabled}
				/>
				<span class="text-[10px] text-gray-400">{style.fontSize}pt</span>
			</div>
		</div>
	{/each}
</div>
