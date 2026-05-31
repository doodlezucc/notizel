import { Vectors, type Vector } from '$lib/data/common';
import type { CanvasFileData, CanvasObject } from '$lib/data/vault';
import { ChangeHistory } from '$lib/packages/history';
import type { UIEditingScope } from './ui-editing-scope';
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
		this.#editingScope = null;
	}

	startEditing(scope: UIEditingScope) {
		this.#editingScope = scope;
	}

	addTextAreaObject(center: Vector) {
		this.#canvasHistory.execute('Add text area', () => {
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
			this.#editingScope = { type: 'text', objectId: newObjectId };

			return () => {
				this.selection.deselect(newObjectId);
				this.#canvas.objects = this.#canvas.objects.filter((object) => object.id !== newObjectId);
			};
		});
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
