import {
	Vectors,
	type CameraTransform,
	type DynamicWidthTextAlignment,
	type ID,
	type Vector,
	type VerticalAlignment
} from '$lib/data/common';
import type { TextBoxAlignment } from '$lib/data/text-box-layout';
import type { CanvasFileData, Vault, VaultFileMeta } from '$lib/data/vault';
import type { GestureHandle } from './gestures/gestures';
import { freezeCanvasObject, type LiveCanvasObject } from './live-objects';
import { UICommands } from './ui-commands';
import type { UIDOMBridge } from './ui-dom-bridge';
import { UIGeneralEditingScope, type UIEditingScope } from './ui-editing-scope.svelte';

interface DefaultTextAreaAlignment {
	alignH: DynamicWidthTextAlignment;
	alignV: VerticalAlignment;
}

export interface MutableUIState {
	camera: CameraTransform;

	readonly activeGesture: GestureHandle | null;
	readonly defaultAlignmentForNewTextArea: DefaultTextAreaAlignment;
}

export type SnapshotUIState = {
	readonly vault: Vault;
	readonly fileMeta: VaultFileMeta | null;

	readonly objects: LiveCanvasObject[];
	readonly editingScope: UIEditingScope | null;
	readonly selectedIds: ReadonlySet<ID>;
};

export type UIContext = MutableUIState &
	SnapshotUIState & {
		readonly bridge: UIDOMBridge;
		readonly commands: UICommands;
	};

export class UIState {
	camera = $state<CameraTransform>({
		position: { x: 0, y: 0 },
		scale: 1
	});
	activeGesture = $state<GestureHandle | null>(null);

	vault = $state<Vault>({ files: [] });
	fileMeta = $state<VaultFileMeta | null>(null);

	objects = $state<LiveCanvasObject[]>([]);
	editingScope = $state.raw<UIEditingScope>(new UIGeneralEditingScope([]));

	defaultAlignmentForNewTextArea = $state<DefaultTextAreaAlignment>({
		alignH: 'center',
		alignV: 'top'
	});

	inferDefaultTextAreaAlignmentFrom({ alignH, alignV }: TextBoxAlignment) {
		this.defaultAlignmentForNewTextArea = {
			// A justified horizontal alignment requires a fixed width, which
			// new text area objects shouldn't have.
			alignH: alignH === 'justify' ? 'start' : alignH,
			alignV: alignV
		};
	}

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

	requireGeneralEditingScope() {
		if (!(this.editingScope instanceof UIGeneralEditingScope)) {
			throw new Error('Selection is only possible in a general editing scope');
		}
		return this.editingScope;
	}

	applySelection(idSet: ReadonlySet<ID>) {
		const scope = this.requireGeneralEditingScope();

		const idsToRemove = scope.selectedIds.difference(idSet);

		if (idsToRemove.size === scope.selectedIds.size) {
			scope.selectedIds.clear();
		} else {
			for (const idToRemove of idsToRemove) {
				scope.selectedIds.delete(idToRemove);
			}
		}

		const idsToAdd = idSet.difference(scope.selectedIds);
		for (const idToAdd of idsToAdd) {
			scope.selectedIds.add(idToAdd);
		}
	}
}
