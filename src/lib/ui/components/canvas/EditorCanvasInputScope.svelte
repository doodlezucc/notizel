<script lang="ts" module>
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import type { Snippet } from 'svelte';
	import { InputSet } from 'svelte-input-system';
	import ClipboardPasteWrapper from './ClipboardPasteWrapper.svelte';

	export const CanvasInputSet = InputSet.stateful({
		actions: {
			escape: [{ logicalKey: 'Escape' }],

			save: [{ logicalKey: 'S', modifiers: { ctrl: true } }, { logicalKey: 'Save' }],

			undo: [{ logicalKey: 'Z', modifiers: { ctrl: true, shift: false } }, { logicalKey: 'Undo' }],
			redo: [
				{ logicalKey: 'Z', modifiers: { ctrl: true, shift: true } },
				{ logicalKey: 'Y', modifiers: { ctrl: true } },
				{ logicalKey: 'Redo' }
			],

			delete: [{ logicalKey: 'Backspace' }, { logicalKey: 'Delete' }],
			copy: [{ logicalKey: 'C', modifiers: { ctrl: true } }, { logicalKey: 'Copy' }],
			cut: [{ logicalKey: 'X', modifiers: { ctrl: true } }, { logicalKey: 'Cut' }],

			modifierDuplicate: [{ logicalKey: 'Alt' }]
		}
	});
</script>

<script lang="ts">
	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const ui = useUI();

	const GeneralEditingInputSet = CanvasInputSet.state.conditional(
		() => ui.editingScope instanceof UIGeneralEditingScope
	);

	GeneralEditingInputSet.actions.delete.handleDown(() => {
		ui.commands.selection.deleteSelectedObjects();
	});

	GeneralEditingInputSet.actions.copy.handleDown(() => {
		ui.commands.clipboard.copySelectionToClipboard();
	});
	GeneralEditingInputSet.actions.cut.handleDown(() => {
		ui.commands.clipboard.cutSelectionToClipboard();
	});

	CanvasInputSet.state.actions.save.handleDown(() => {
		ui.commands.io.saveFile();
	});

	CanvasInputSet.state.actions.escape.handleDownWithRepeats(() => {
		ui.commands.exitCurrentScope();
	});

	CanvasInputSet.state.actions.undo.handleDownWithRepeats(() => {
		const change = ui.commands.undo();

		if (change) {
			console.log(`Undo "${change.message}"`);
		}
	});
	CanvasInputSet.state.actions.redo.handleDownWithRepeats(() => {
		const change = ui.commands.redo();

		if (change) {
			console.log(`Redo "${change.message}"`);
		}
	});
</script>

<ClipboardPasteWrapper>
	{@render children()}
</ClipboardPasteWrapper>
