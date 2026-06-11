import { AxisAlignedBoundingBox, Vectors, type Vector } from '$lib/data/common';
import {
	AreaSelectGestureStateImpl,
	type ObjectAreaSelectInformation
} from '../gestures/area-select.svelte';
import {
	createGesture,
	type AreaSelectGestureHandle,
	type ControlledGestureHandle,
	type CreateGestureOptions,
	type ObjectTransformGestureHandle
} from '../gestures/gestures';
import { freezeCanvasObject } from '../live-objects';
import { StackUser } from '../stack/stack-user';

export class UICommandsGestures extends StackUser {
	private activeGesture: ControlledGestureHandle | null = null;

	get hasActiveGesture() {
		return this.activeGesture !== null;
	}

	cancelActive() {
		if (this.activeGesture) {
			this.activeGesture.cancel();
			this.activeGesture = null;
		}
	}

	startAreaSelecting(
		pointerInClientSpace: Vector,
		{ deselectOthers }: { deselectOthers: boolean }
	) {
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

		const state = new AreaSelectGestureStateImpl(objects, initialPointer);
		this.ui.activeGesture = state;

		return this.startGesture<AreaSelectGestureHandle>({
			createHandle: (gesture) => ({
				updatePointerPosition: (currentPointer) => {
					if (gesture.isComplete()) return;

					state.updateArea(AxisAlignedBoundingBox.fromPoints(initialPointer, currentPointer));
				}
			}),

			onComplete: () => {
				const objectIdsInArea = new Set(state.idsInArea);

				const newSelection = deselectOthers
					? objectIdsInArea
					: objectIdsInArea.union(selectionAtStart);

				if (newSelection.symmetricDifference(selectionAtStart).size > 0) {
					this.history.execute('Area select', () => {
						this.ui.applySelection(newSelection);

						return () => {
							this.ui.applySelection(selectionAtStart);
						};
					});
				}
			}
		});
	}

	startMovingSelectedObjects() {
		const scope = this.requireGeneralEditingScope();
		const affectedIds = new Set(scope.selectedIds);

		let totalOffset: Vector = { x: 0, y: 0 };

		return this.startGesture<ObjectTransformGestureHandle>({
			createHandle: (gesture) => ({
				moveObjectsBy: (offset) => {
					if (gesture.isComplete()) return;

					this.ui.moveObjectsByOffset(affectedIds, offset);
					totalOffset = Vectors.add(totalOffset, offset);
				}
			}),

			onComplete: () => {
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

			onCancel: () => {
				this.ui.moveObjectsByOffset(affectedIds, Vectors.negate(totalOffset));
			}
		});
	}

	startMovingSelectedObjectsAsDuplicates() {
		const scope = this.requireGeneralEditingScope();
		const previousSelection = new Set(scope.selectedIds);

		let newObjects = this.ui.objects
			.filter((object) => previousSelection.has(object.id))
			.map((object) => freezeCanvasObject(object))
			.map((frozenObject) => this.stack.liveObjectInstantiator.unfreezeCanvasObject(frozenObject));

		const newIds = new Set(newObjects.map((object) => object.id));

		this.ui.objects.push(...newObjects);
		this.ui.applySelection(newIds);

		return this.startGesture<ObjectTransformGestureHandle>({
			createHandle: (gesture) => ({
				moveObjectsBy: (offset) => {
					if (gesture.isComplete()) return;

					this.ui.moveObjectsByOffset(newIds, offset);
				}
			}),

			onComplete: () => {
				// Update latest object changes for later redo.
				newObjects = this.ui.objects.filter((object) => newIds.has(object.id));

				const message = newIds.size === 1 ? 'Duplicate object' : `Duplicate ${newIds.size} objects`;

				this.history.execute(message, ({ isRedo }) => {
					if (isRedo) {
						this.ui.objects.push(...newObjects);
						this.ui.applySelection(newIds);
					}

					return () => {
						this.ui.objects = this.ui.objects.filter((object) => !newIds.has(object.id));
						this.ui.applySelection(previousSelection);
					};
				});
			},

			onCancel: () => {
				this.ui.objects = this.ui.objects.filter((object) => !newIds.has(object.id));
				this.ui.applySelection(previousSelection);
			}
		});
	}

	private startGesture<T>(options: CreateGestureOptions<T>): ControlledGestureHandle<T> {
		if (this.activeGesture) {
			throw new Error('A different gesture is already in progress');
		}

		const gesture = createGesture({
			...options,

			onComplete: () => {
				this.activeGesture = null;
				this.ui.activeGesture = null;

				options.onComplete?.();
			},

			onCancel: () => {
				this.activeGesture = null;
				this.ui.activeGesture = null;

				options.onCancel?.();
			}
		});

		this.activeGesture = gesture;
		return gesture;
	}
}
