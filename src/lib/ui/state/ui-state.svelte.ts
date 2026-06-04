import { Vectors, type CameraTransform, type ID, type Vector } from '$lib/data/common';
import { type LiveCanvasObject } from './live-objects';
import { UICommands } from './ui-commands';
import type { UIEditingScope } from './ui-editing-scope';
import { UISelection, type ReadonlyUISelection } from './ui-selection.svelte';

export interface MutableUIState {
	camera: CameraTransform;
}

export type SnapshotUIState = {
	readonly objects: LiveCanvasObject[];
	readonly editingScope: UIEditingScope | null;
	readonly selection: ReadonlyUISelection;
};

export type UIContext = MutableUIState &
	SnapshotUIState & {
		readonly commands: UICommands;
	};

export class UIState {
	camera = $state<CameraTransform>({
		position: { x: 0, y: 0 },
		scale: 1
	});
	objects = $state<LiveCanvasObject[]>([]);
	editingScope = $state<UIEditingScope | null>(null);

	readonly selection = new UISelection();

	moveObjectsByOffset(objectIds: ReadonlySet<ID>, offset: Vector) {
		for (const object of this.objects) {
			if (objectIds.has(object.id)) {
				this.moveObjectByOffset(object, offset);
			}
		}
	}

	private moveObjectByOffset(object: LiveCanvasObject, offset: Vector) {
		switch (object.type) {
			case 'text':
				object.anchor = Vectors.add(object.anchor, offset);
				return;
		}
	}
}
