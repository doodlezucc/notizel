import { Vectors, type ID, type Vector } from '$lib/data/common';
import { ChangeHistory } from '$lib/packages/history';
import type { OmitFromUnion } from '$lib/util/types';
import { createTextAreaEditor, type LiveTextCanvasObject } from './live-objects';
import type { UIEditingScope, UITextAreaEditingScope } from './ui-editing-scope';
import type { UIState } from './ui-state.svelte';

export class UICommands {
	private readonly ui: UIState;
	private history = new ChangeHistory();

	constructor(ui: UIState) {
		this.ui = ui;
	}

	undo() {
		return this.history.undo();
	}

	redo() {
		return this.history.redo();
	}

	createTextArea(props: OmitFromUnion<LiveTextCanvasObject, 'id' | 'type' | 'editor'>) {
		const objectId = crypto.randomUUID(); // Maybe swap this out with a simple incremental ID

		const newObject: LiveTextCanvasObject = {
			...props,
			id: objectId,
			type: 'text',
			editor: createTextAreaEditor('')
		};

		this.history.execute('Add text area', () => {
			this.ui.objects.push(newObject);
			this.ui.selection.set([objectId]);

			return () => {
				this.ui.selection.clear();
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);
			};
		});
	}

	/** Called when tapping empty space. */
	exitScope() {
		if (this.ui.editingScope) {
			this.exitEditingScope();
		} else {
			this.ui.selection.clear();
		}
	}

	private exitEditingScope() {
		if (this.ui.editingScope?.type === 'text') {
			this.onExitTextAreaScope(this.ui.editingScope);
		}

		this.ui.editingScope = null;
	}

	private onExitTextAreaScope(scope: UITextAreaEditingScope) {
		const { objectId } = scope;
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject) return;

		if (textObject.editor.isEmpty) {
			// Auto-delete empty text area

			this.history.execute('Remove empty text area', () => {
				this.ui.selection.deselect(objectId);
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);

				return () => {
					this.ui.objects.push(textObject);
					this.ui.selection.select(objectId, { deselectOthers: true });
				};
			});
		}
	}

	startEditing(scope: UIEditingScope) {
		this.ui.editingScope = scope;
	}

	// TODO: Refactor into borrowed gesture handle
	moveSelectionByOffset(offset: Vector) {
		this.ui.moveObjectsByOffset(this.ui.selection.selectedIds, offset);
	}

	submitMoveSelectionByOffset(totalOffset: Vector) {
		const affectedIds = new Set(this.ui.selection.selectedIds);

		const message = affectedIds.size === 1 ? 'Move object' : `Move ${affectedIds.size} objects`;

		this.history.execute(message, ({ isRedo }) => {
			if (isRedo) {
				this.ui.selection.set(affectedIds);
				this.ui.moveObjectsByOffset(affectedIds, totalOffset);
			}

			return () => {
				this.ui.selection.set(affectedIds);
				this.ui.moveObjectsByOffset(affectedIds, Vectors.negate(totalOffset));
			};
		});
	}

	select(id: ID, { deselectOthers }: { deselectOthers: boolean }) {
		this.ui.selection.select(id, { deselectOthers });
	}

	deleteSelection() {
		const affectedIds = new Set(this.ui.selection.selectedIds);
		if (affectedIds.size === 0) {
			return;
		}

		const message = affectedIds.size === 1 ? 'Remove object' : `Remove ${affectedIds.size} objects`;
		const affectedObjects = this.ui.objects.filter((object) => affectedIds.has(object.id));

		this.history.execute(message, () => {
			this.ui.selection.clear();
			this.ui.objects = this.ui.objects.filter((object) => !affectedIds.has(object.id));

			return () => {
				this.ui.selection.set(affectedIds);
				this.ui.objects.push(...affectedObjects);
			};
		});
	}
}
