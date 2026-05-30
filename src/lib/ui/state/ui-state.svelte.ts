import { Vectors, type ID, type Vector } from '$lib/data/common';
import type { CanvasFileData, CanvasObject } from '$lib/data/vault';
import { UISelection } from './ui-selection.svelte';

export class UICanvasState {
	#canvas = $state() as CanvasFileData;
	readonly selection = new UISelection();

	constructor(canvas: CanvasFileData) {
		this.#canvas = canvas;
	}

	readonly canvas = $derived(this.#canvas);

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
