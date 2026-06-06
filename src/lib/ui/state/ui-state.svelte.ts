import { Vectors, type CameraTransform, type ID, type Vector } from '$lib/data/common';
import type { CanvasFileData, Vault, VaultFileMeta } from '$lib/data/vault';
import { freezeCanvasObject, type LiveCanvasObject } from './live-objects';
import { UICommands, type Gesture } from './ui-commands';
import type { UIDOMBridge } from './ui-dom-bridge';
import { UIGeneralEditingScope, type UIEditingScope } from './ui-editing-scope.svelte';

export interface MutableUIState {
	camera: CameraTransform;
}

export type SnapshotUIState = {
	readonly vault: Vault;
	readonly fileMeta: VaultFileMeta | null;

	readonly objects: LiveCanvasObject[];
	readonly editingScope: UIEditingScope | null;
	readonly selectedIds: ReadonlySet<ID>;

	// TODO: This should be refactored into only exposing properties
	// of the gesture instead of functions.
	readonly activeGesture: Gesture | null;
};

export type UIContext = MutableUIState &
	SnapshotUIState & {
		readonly bridge: UIDOMBridge;
		readonly commands: UICommands;
	};

export class UIState {
	vault = $state<Vault>({ files: [] });
	fileMeta = $state<VaultFileMeta | null>(null);

	camera = $state<CameraTransform>({
		position: { x: 0, y: 0 },
		scale: 1
	});

	objects = $state<LiveCanvasObject[]>([]);
	editingScope = $state.raw<UIEditingScope>(new UIGeneralEditingScope([]));

	activeGesture = $state<Gesture | null>(null);

	toFileData(): CanvasFileData {
		return {
			camera: $state.snapshot(this.camera),
			objects: this.objects.map(freezeCanvasObject)
		};
	}

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
