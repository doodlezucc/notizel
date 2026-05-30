<script lang="ts" module>
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import type { Snippet } from 'svelte';
	import { InputSet } from 'svelte-input-system';

	export const CanvasInputSet = InputSet.stateful({
		actions: {
			delete: [{ logicalKey: 'Backspace' }, { logicalKey: 'Delete' }]
		}
	});
</script>

<script lang="ts">
	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const ui = useUI();

	CanvasInputSet.state
		.conditional(() => ui.editingScope === null)
		.actions.delete.handleDown(() => {
			ui.deleteSelection();
		});
</script>

{@render children()}
