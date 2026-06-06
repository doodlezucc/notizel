import { AxisAlignedBoundingBox, Vectors, type ID, type Vector } from '$lib/data/common';
import type { CanvasFileData, TextBoxLayout, VaultFileMeta } from '$lib/data/vault';
import { type Change } from '$lib/packages/history';
import type { OmitFromUnion } from '$lib/util/types';
import { Temporal } from 'temporal-polyfill';
import {
	AreaSelectGestureStateImpl,
	type ObjectAreaSelectInformation
} from './gestures/area-select.svelte';
import type {
	AreaSelectGestureHandle,
	GestureHandle,
	ObjectTransformGestureHandle
} from './gestures/gestures';
import { unfreezeCanvasObject, type LiveTextCanvasObject } from './live-objects';
import { StackUser } from './stack/stack-user';
import { UIGeneralEditingScope, UITextAreaEditingScope } from './ui-editing-scope.svelte';

export class UICommands extends StackUser {
	private activeGesture: GestureHandle | null = null;

	private get persistence() {
		return this.stack.persistence;
	}

	async saveFile() {
		const now = Temporal.Now.instant();

		if (!this.ui.fileMeta) {
			const newFileId = this.persistence.generateFileId();

			const meta: VaultFileMeta = {
				id: newFileId,
				createdAt: now,
				modifiedAt: now,
				name: 'Untitled'
			};

			await this.persistence.saveFileMeta(meta);
			await this.persistence.saveFile(meta.id, this.ui.toFileData());
			this.ui.vault.files.push(meta);
			this.ui.fileMeta = meta;
		} else {
			const meta = this.ui.fileMeta;
			meta.modifiedAt = now;
			await this.persistence.saveFileMeta(meta);
			await this.persistence.saveFile(meta.id, this.ui.toFileData());
		}
	}

	async loadFile(fileId: ID) {
		const fileMeta = this.ui.vault.files.find((file) => file.id === fileId);

		if (!fileMeta) {
			throw new Error('File meta to load by ID not available in vault');
		}

		const fileData = await this.persistence.loadFile(fileId);

		this.applyFromFile(fileMeta, fileData);
	}

	private applyFromFile(meta: VaultFileMeta, data: CanvasFileData) {
		this.ui.fileMeta = meta;
		this.ui.camera = data.camera;
		this.ui.objects = data.objects.map((object) =>
			unfreezeCanvasObject(object, this.stack.liveObjectInstantiator)
		);
		this.ui.editingScope = new UIGeneralEditingScope([]);
	}

	undo() {
		if (this.activeGesture) {
			this.activeGesture.cancel();
			return null;
		}

		return this.history.undo();
	}

	redo() {
		if (this.activeGesture) {
			return null;
		}

		return this.history.redo();
	}

	createTextArea(props: OmitFromUnion<LiveTextCanvasObject, 'id' | 'type' | 'editor'>) {
		const objectId = crypto.randomUUID(); // Maybe swap this out with a simple incremental ID

		const newObject: LiveTextCanvasObject = {
			...props,
			id: objectId,
			type: 'text',
			editor: this.stack.liveObjectInstantiator.createTiptapEditor('')
		};

		const previousScope = this.ui.editingScope;

		this.history.execute('Add text area', () => {
			this.ui.objects.push(newObject);
			this.ui.editingScope = new UITextAreaEditingScope(objectId);

			return () => {
				this.ui.editingScope = previousScope;
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);
			};
		});
	}

	cancelActiveGesture() {
		if (this.activeGesture) {
			this.activeGesture.cancel();
			this.activeGesture = null;
		}
	}

	exitCurrentScope() {
		if (this.activeGesture) {
			this.activeGesture.cancel();
			this.activeGesture = null;
			return;
		}

		const scope = this.ui.editingScope;
		if (scope instanceof UITextAreaEditingScope) {
			this.exitTextAreaScope(scope);
		} else if (scope instanceof UIGeneralEditingScope) {
			this.clearSelection();
		}
	}

	private exitTextAreaScope(scope: UITextAreaEditingScope) {
		const { objectId } = scope;
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject) return;

		if (textObject.editor.isEmpty) {
			// Auto-delete empty text area

			// Set last editor content to what it was just before clearing
			textObject.editor.commands.undo();

			this.history.execute('Remove empty text area', () => {
				this.ui.editingScope = new UIGeneralEditingScope([]);
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);

				return () => {
					this.ui.objects.push(textObject);
					this.ui.editingScope = scope;
				};
			});
		} else {
			this.history.execute('Exit text editing', () => {
				this.ui.editingScope = new UIGeneralEditingScope([objectId]);

				return () => {
					this.ui.editingScope = scope;
				};
			});
		}
	}

	enterTextAreaEditingScope(textObjectId: ID) {
		const previousScope = this.ui.editingScope;

		this.history.execute('Enter text editing', () => {
			this.ui.editingScope = new UITextAreaEditingScope(textObjectId);

			return () => {
				this.ui.editingScope = previousScope;
			};
		});
	}

	startAreaSelecting(pointerInClientSpace: Vector) {
		const scope = this.requireGeneralEditingScope();
		const selectionAtStart = new Set(scope.selectedIds);

		const initialPointer = pointerInClientSpace;
		const objects: ObjectAreaSelectInformation[] = [];

		for (const object of this.ui.objects) {
			const handle = this.stack.domBridge.getHandle(object.id);

			if (handle) {
				objects.push({
					id: object.id,
					bounds: handle.computeBoundsInClientSpace()
				});
			}
		}

		let isDone = false;

		const state = new AreaSelectGestureStateImpl(objects, initialPointer);
		this.ui.activeGesture = state;

		return this.startGesture<AreaSelectGestureHandle>({
			updatePointerPosition: (currentPointer) => {
				state.updateArea(AxisAlignedBoundingBox.fromPoints(initialPointer, currentPointer));
			},

			submit: () => {
				if (isDone) return;
				isDone = true;
				this.activeGesture = null;
				this.ui.activeGesture = null;

				const objectIdsInArea = new Set(state.idsInArea);
				const newSelection = objectIdsInArea;

				if (newSelection.symmetricDifference(selectionAtStart).size > 0) {
					// TODO: deselectOthers should be determined by the initial pointer event
					// (and reflected in the UI already WHILE area selecting).
					this.select(objectIdsInArea, { deselectOthers: true });
				}
			},

			cancel: () => {
				if (isDone) return;
				isDone = true;

				this.activeGesture = null;
				this.ui.activeGesture = null;
			}
		});
	}

	startMovingSelection() {
		const scope = this.requireGeneralEditingScope();
		const affectedIds = new Set(scope.selectedIds);

		let totalOffset: Vector = { x: 0, y: 0 };
		let isGestureDone = false;

		return this.startGesture<ObjectTransformGestureHandle>({
			moveObjectsBy: (offset) => {
				if (isGestureDone) return;

				this.ui.moveObjectsByOffset(affectedIds, offset);
				totalOffset = Vectors.add(totalOffset, offset);
			},

			submit: () => {
				if (isGestureDone) return;
				isGestureDone = true;
				this.activeGesture = null;

				const message = affectedIds.size === 1 ? 'Move object' : `Move ${affectedIds.size} objects`;

				this.history.execute(message, ({ isRedo }) => {
					if (isRedo) {
						this.ui.moveObjectsByOffset(affectedIds, totalOffset);
					}

					return () => {
						this.ui.moveObjectsByOffset(affectedIds, Vectors.negate(totalOffset));
					};
				});
			},

			cancel: () => {
				if (isGestureDone) return;
				isGestureDone = true;
				this.activeGesture = null;

				this.ui.moveObjectsByOffset(affectedIds, Vectors.negate(totalOffset));
			}
		});
	}

	private startGesture<T extends GestureHandle>(gesture: T): T {
		if (this.activeGesture) {
			throw new Error('A different gesture is already in progress');
		}

		this.activeGesture = gesture;
		return gesture;
	}

	submitTextAreaLayout(objectId: ID, layout: TextBoxLayout) {
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject || textObject.type !== 'text') {
			throw new Error('Object is not a text area');
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, type, editor, ...previousLayout } = textObject;

		this.history.execute('Change textbox layout', () => {
			Object.assign(textObject, layout);

			return () => {
				Object.assign(textObject, previousLayout);
			};
		});
	}

	select(ids: Iterable<ID>, { deselectOthers }: { deselectOthers: boolean }) {
		const idsToSelect = new Set(ids);

		this.history.execute(
			'Select',
			this.createSelectionChange((currentSelection) => {
				if (deselectOthers) {
					return idsToSelect;
				} else {
					return currentSelection.union(idsToSelect);
				}
			})
		);
	}

	toggleSelected(id: ID) {
		this.history.execute(
			'Toggle select',
			this.createSelectionChange((currentSelection) => {
				const newSelection = new Set(currentSelection);

				if (!newSelection.delete(id)) {
					// ID was not previously present in the set.
					newSelection.add(id);
				}

				return newSelection;
			})
		);
	}

	private createSelectionChange(modifySelection: (set: ReadonlySet<ID>) => Set<ID>): Change {
		const scope = this.requireGeneralEditingScope();
		const previousSelection = new Set(scope.selectedIds);
		const newSelection = modifySelection(scope.selectedIds);

		return () => {
			this.applySelection(newSelection);

			return () => {
				this.applySelection(previousSelection);
			};
		};
	}

	private applySelection(idSet: ReadonlySet<ID>) {
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

	private requireGeneralEditingScope(): UIGeneralEditingScope {
		if (!(this.ui.editingScope instanceof UIGeneralEditingScope)) {
			throw new Error('Selection is only possible in a general editing scope');
		}
		return this.ui.editingScope;
	}

	clearSelection() {
		if (this.requireGeneralEditingScope().selectedIds.size === 0) {
			// Nothing is selected
			return;
		}

		this.history.execute(
			'Deselect all',
			this.createSelectionChange(() => new Set())
		);
	}

	deleteSelection() {
		const scope = this.requireGeneralEditingScope();

		const affectedIds = new Set(scope.selectedIds);
		if (affectedIds.size === 0) {
			return;
		}

		const message = affectedIds.size === 1 ? 'Remove object' : `Remove ${affectedIds.size} objects`;
		const affectedObjects = this.ui.objects.filter((object) => affectedIds.has(object.id));

		this.history.execute(message, () => {
			const scope = this.requireGeneralEditingScope();
			scope.selectedIds.clear();
			this.ui.objects = this.ui.objects.filter((object) => !affectedIds.has(object.id));

			return () => {
				const scope = this.requireGeneralEditingScope();
				this.ui.objects.push(...affectedObjects);

				for (const id of affectedIds) {
					scope.selectedIds.add(id);
				}
			};
		});
	}
}
