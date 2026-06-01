import { Vectors, type ID, type Vector } from '$lib/data/common';
import type { CanvasFileData, CanvasObject } from '$lib/data/vault';
import { ChangeHistory } from '$lib/packages/history';
import { isTipTapContentEmpty } from '$lib/util/tiptap-is-empty';
import type { UIEditingScope, UITextAreaEditingScope } from './ui-editing-scope';
import { UISelection } from './ui-selection.svelte';

export class UICanvasState {
	#canvas = $state() as CanvasFileData;
	#editingScope = $state(null) as UIEditingScope | null;

	#canvasHistory = new ChangeHistory();
	readonly selection = new UISelection();

	constructor(canvas: CanvasFileData) {
		this.#canvas = canvas;
	}

	readonly canvas = $derived(this.#canvas);
	readonly editingScope = $derived(this.#editingScope);

	private get focusedHistory(): ChangeHistory | null {
		if (this.#editingScope === null) {
			return this.#canvasHistory;
		} else {
			return null;
		}
	}

	undo() {
		return this.focusedHistory?.undo() ?? null;
	}

	redo() {
		return this.focusedHistory?.redo() ?? null;
	}

	stopEditing() {
		if (this.#editingScope?.type === 'text') {
			this.onExitTextAreaScope(this.#editingScope);
		}

		this.#editingScope = null;
	}

	private onExitTextAreaScope(scope: UITextAreaEditingScope) {
		const { objectId, wasJustCreated } = scope;
		const textObject = this.#canvas.objects.find((object) => object.id === objectId);

		if (!textObject) return;

		const objectSnapshot = $state.snapshot(textObject);

		const textContent = objectSnapshot.content;
		if (isTipTapContentEmpty(textContent)) {
			// Auto-delete empty text area

			if (wasJustCreated) {
				// Delete without notifying history stack
				this.selection.deselect(objectId);
				this.#canvas.objects = this.#canvas.objects.filter((object) => object.id !== objectId);
			} else {
				this.#canvasHistory.execute('Remove empty text area', () => {
					this.selection.deselect(objectId);
					this.#canvas.objects = this.#canvas.objects.filter((object) => object.id !== objectId);

					return () => {
						this.#canvas.objects.push({
							...objectSnapshot,
							content: scope.originalContent
						});
						this.selection.select(objectId, { deselectOthers: false });
					};
				});
			}
		} else {
			if (wasJustCreated) {
				this.#canvasHistory.execute('Add text area', ({ isRedo }) => {
					if (isRedo) {
						this.#canvas.objects.push(objectSnapshot);
						this.selection.select(objectId, { deselectOthers: false });
					}

					return () => {
						this.selection.deselect(objectId);
						this.#canvas.objects = this.#canvas.objects.filter((object) => object.id !== objectId);
					};
				});
			}
		}
	}

	startEditing(scope: UIEditingScope) {
		this.#editingScope = scope;
	}

	addTextAreaObject(center: Vector) {
		const newObjectId = crypto.randomUUID(); // Maybe swap this out with a simple incremental ID

		this.#canvas.objects.push({
			id: newObjectId,
			type: 'text',
			content: '',
			alignH: 'center',
			alignV: 'center',
			anchor: center
		});
		this.selection.select(newObjectId, { deselectOthers: true });

		this.#editingScope = {
			type: 'text',
			objectId: newObjectId,
			wasJustCreated: true,
			originalContent: ''
		};
	}

	moveSelectionByOffset(offset: Vector) {
		this.moveObjectsByOffset(this.selection.selectedIds, offset);
	}

	submitMoveSelectionByOffset(totalOffset: Vector) {
		const affectedIds = new Set(this.selection.selectedIds);

		const message = affectedIds.size === 1 ? 'Move object' : `Move ${affectedIds.size} objects`;

		this.#canvasHistory.execute(message, ({ isRedo }) => {
			if (isRedo) {
				this.selection.set(affectedIds);
				this.moveObjectsByOffset(affectedIds, totalOffset);
			}

			return () => {
				this.selection.set(affectedIds);
				this.moveObjectsByOffset(affectedIds, Vectors.negate(totalOffset));
			};
		});
	}

	private moveObjectsByOffset(objectIds: ReadonlySet<ID>, offset: Vector) {
		for (const object of this.#canvas.objects) {
			if (objectIds.has(object.id)) {
				this.moveObjectByOffset(object, offset);
			}
		}
	}

	private moveObjectByOffset(object: CanvasObject, offset: Vector) {
		switch (object.type) {
			case 'text':
				object.anchor = Vectors.add(object.anchor, offset);
				return;
		}
	}

	deleteSelection() {
		const idsToRemove = new Set(this.selection.selectedIds);
		if (idsToRemove.size === 0) {
			return;
		}

		this.stopEditing();
		this.selection.clear();
		this.#canvas.objects = this.#canvas.objects.filter((object) => !idsToRemove.has(object.id));
	}
}
