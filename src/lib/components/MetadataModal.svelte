<script lang="ts">
	let {
		pendingMetadata,
		onSave,
		onCancel
	}: {
		pendingMetadata: Record<string, string>;
		onSave: (metadata: Record<string, string>) => void;
		onCancel: () => void;
	} = $props();

	let pairs = $state<{ key: string; value: string }[]>(
		Object.entries(pendingMetadata).map(([key, value]) => ({ key, value }))
	);

	function addPair() {
		pairs = [...pairs, { key: '', value: '' }];
	}

	function removePair(index: number) {
		pairs = pairs.filter((_, i) => i !== index);
	}

	function handleSave() {
		const result: Record<string, string> = {};
		for (const pair of pairs) {
			const k = pair.key.trim();
			const v = pair.value.trim();
			if (k && v) {
				result[k] = v;
			}
		}
		onSave(result);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}

	// Portal action: move overlay to document.body to prevent layout interference
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<div
	use:portal
	class="modal-overlay"
	onclick={onCancel}
	onkeydown={handleKeydown}
	role="dialog"
	tabindex="-1"
>
	<div
		class="modal-card"
		role="document"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<h3 class="text-base font-semibold text-gray-800 mb-1">Row Metadata</h3>
		<p class="text-xs text-gray-500 mb-3">Persists until changed</p>

		<div class="space-y-2 mb-4">
			{#each pairs as pair, i}
				<div class="flex items-center gap-2">
					<input
						type="text"
						class="flex-1 px-2 py-1 text-xs t-input-border"
						placeholder="key"
						bind:value={pair.key}
					/>
					<input
						type="text"
						class="flex-1 px-2 py-1 text-xs t-input-border"
						placeholder="value"
						bind:value={pair.value}
					/>
					<button
						class="text-[10px] text-gray-400 hover:text-red-600 cursor-pointer"
						onclick={() => removePair(i)}>[x]</button
					>
				</div>
			{/each}
		</div>

		<button class="text-xs text-gray-500 hover:text-gray-800 cursor-pointer mb-4" onclick={addPair}
			>[+] Add pair</button
		>

		<div class="flex justify-end items-center border-t border-gray-200 pt-3">
			<button class="text-xs text-gray-400 hover:text-gray-600 cursor-pointer" onclick={onCancel}
				>[cancel]</button
			>
			<span class="text-xs text-gray-300 mx-1">/</span>
			<button class="text-xs font-semibold text-gray-800 cursor-pointer" onclick={handleSave}
				>[<span class="underline">save</span>]</button
			>
		</div>
	</div>
</div>
