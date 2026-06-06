import { AxisAlignedBoundingBox, Vectors, type Vector } from '$lib/data/common';
import {
	AreaSelectGestureStateImpl,
	type ObjectAreaSelectInformation
} from '../gestures/area-select.svelte';
import type {
	AreaSelectGestureHandle,
	GestureHandle,
	ObjectTransformGestureHandle
} from '../gestures/gestures';
import { StackUser } from '../stack/stack-user';

export class UICommandsGestures extends StackUser {
	private activeGesture: GestureHandle | null = null;

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
			},

			cancel: () => {
				if (isDone) return;
				isDone = true;

				this.activeGesture = null;
				this.ui.activeGesture = null;
			}
		});
	}

	startMovingSelectedObjects() {
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
}
