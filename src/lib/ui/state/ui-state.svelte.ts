import { Vectors, type ID, type Vector } from '$lib/data/common';
import type { CanvasFileData, CanvasObject } from '$lib/data/vault';
import type { UIEditingScope } from './ui-editing-scope';
import { UISelection } from './ui-selection.svelte';

export class UICanvasState {
	#canvas = $state() as CanvasFileData;
	#editingScope = $state(null) as UIEditingScope | null;
	readonly selection = new UISelection();

	constructor(canvas: CanvasFileData) {
		this.#canvas = canvas;
	}

	readonly canvas = $derived(this.#canvas);
	readonly editingScope = $derived(this.#editingScope);

	stopEditing() {
		this.#editingScope = null;
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
		this.#editingScope = { type: 'text', objectId: newObjectId };
	}

	moveObjectsByOffset(objectIds: Iterable<ID>, offset: Vector) {
		const objectIdSet = new Set(objectIds);

		for (const object of this.#canvas.objects) {
			if (objectIdSet.has(object.id)) {
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
}
