import { Vectors, type Vector } from '$lib/data/common';
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

		const textContent = $state.snapshot(textObject.content);
		if (isTipTapContentEmpty(textContent)) {
			// Auto-delete empty text area

			if (wasJustCreated) {
				// Delete without notifying history stack
				this.selection.deselect(objectId);
				this.#canvas.objects = this.#canvas.objects.filter((object) => object.id !== objectId);
			} else {
				// TODO: Register deletion in history
			}
		} else {
			if (wasJustCreated) {
				// TODO: Register creation in history
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

		// 	return () => {
		// 		this.selection.deselect(newObjectId);
		// 		this.#canvas.objects = this.#canvas.objects.filter((object) => object.id !== newObjectId);
		// 	};
		// });
	}

	moveSelectionByOffset(offset: Vector) {
		for (const object of this.#canvas.objects) {
			if (this.selection.selectedIds.has(object.id)) {
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
