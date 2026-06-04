import type { Change } from '$lib/packages/history';
import { Editor as TiptapEditor, type Content as TiptapContent } from '@tiptap/core';
import { isHistoryTransaction, undoDepth } from '@tiptap/pm/history';
import StarterKit from '@tiptap/starter-kit';
import { CustomUndoRedo } from './custom-history-plugin';

interface Options {
	initialContent: TiptapContent;

	registerHistoryChange: (change: Change) => void;
}

export function createTiptapEditor(options: Options) {
	const { initialContent, registerHistoryChange } = options;

	let currentUndoDepth = 0;

	return new TiptapEditor({
		extensions: [
			StarterKit.configure({
				undoRedo: false
			}),
			CustomUndoRedo
		],
		content: initialContent,
		onTransaction: ({ transaction, editor }) => {
			const newUndoDepth = undoDepth(editor.state);

			if (isHistoryTransaction(transaction)) {
				// This is an undo or a redo, don't worry about adding
				// to the history.
			} else if (newUndoDepth > currentUndoDepth) {
				// This was a completely new thing the user just did there.
				registerHistoryChange(({ isRedo }) => {
					if (isRedo) {
						editor.commands.redo();
					}

					return () => {
						editor.commands.undo();
					};
				});
			}

			currentUndoDepth = newUndoDepth;
		}
	});
}
