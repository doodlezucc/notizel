import { Vectors, type CameraTransform, type ID, type Vector } from '$lib/data/common';
import { type LiveCanvasObject } from './live-objects';
import { UICommands } from './ui-commands';
import { UIGeneralEditingScope, type UIEditingScope } from './ui-editing-scope.svelte';

export interface MutableUIState {
	camera: CameraTransform;
}

export type SnapshotUIState = {
	readonly objects: LiveCanvasObject[];
	readonly editingScope: UIEditingScope | null;
	readonly selectedIds: ReadonlySet<ID>;
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
	editingScope = $state.raw<UIEditingScope>(new UIGeneralEditingScope([]));

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
