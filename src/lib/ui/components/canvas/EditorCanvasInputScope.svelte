<script lang="ts" module>
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import type { Snippet } from 'svelte';
	import { InputSet } from 'svelte-input-system';

	export const CanvasInputSet = InputSet.stateful({
		actions: {
			delete: [{ logicalKey: 'Backspace' }, { logicalKey: 'Delete' }],
			undo: [{ logicalKey: 'Z', modifiers: { ctrl: true, shift: false } }, { logicalKey: 'Undo' }],
			redo: [
				{ logicalKey: 'Z', modifiers: { ctrl: true, shift: true } },
				{ logicalKey: 'Y', modifiers: { ctrl: true } },
				{ logicalKey: 'Redo' }
			]
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

	CanvasInputSet.state.actions.undo.handleDown(() => {
		const change = ui.undo();

		if (change) {
			console.log(`Undo "${change.message}"`);
		}
	});
	CanvasInputSet.state.actions.redo.handleDown(() => {
		const change = ui.redo();

		if (change) {
			console.log(`Redo "${change.message}"`);
		}
	});
</script>

{@render children()}
