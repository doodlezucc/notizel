import { Extension } from '@tiptap/core';
import { history, redo, undo } from '@tiptap/pm/history';

export const CustomUndoRedo = Extension.create({
	name: 'customUndoRedo',

	addProseMirrorPlugins() {
		return [
			history({
				// If there are ever more than this number of undo steps, I'm not sure
				// what would happen. But it's a lot more than the default number of 100.
				depth: 10000
			})
		];
	},

	addCommands() {
		return {
			undo:
				() =>
				({ state, dispatch }) => {
					return undo(state, dispatch);
				},
			redo:
				() =>
				({ state, dispatch }) => {
					return redo(state, dispatch);
				}
		};
	}
});
