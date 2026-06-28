import { type HorizontalDirection, type Vector } from '$lib/data/common';
import { AreaSelectGesture } from '../gestures/area-select.svelte';
import { Gesture, type GestureHandle } from '../gestures/gestures';
import { MoveObjectsAsDuplicatesGesture } from '../gestures/move-objects-as-duplicates.svelte';
import { MoveObjectsGesture } from '../gestures/move-objects.svelte';
import { ResizeTextAreasGesture } from '../gestures/resize-text-areas.svelte';
import { StackUser } from '../stack/stack-user';

export class UICommandsGestures extends StackUser {
	get hasActiveGesture() {
		return this.ui.activeGesture !== null;
	}

	cancelActive() {
		if (this.ui.activeGesture) {
			this.ui.activeGesture.cancel();
			this.ui.activeGesture = null;
		}
	}

	startAreaSelecting(
		pointerInClientSpace: Vector,
		{ deselectOthers }: { deselectOthers: boolean }
	) {
		return this.startGesture(
			new AreaSelectGesture(this.stack, {
				initialPointer: pointerInClientSpace,
				deselectOthers: deselectOthers
			})
		);
	}

	startMovingSelectedObjects() {
		return this.startGesture(new MoveObjectsGesture(this.stack));
	}

	startMovingSelectedObjectsAsDuplicates() {
		return this.startGesture(new MoveObjectsAsDuplicatesGesture(this.stack));
	}

	startResizingSelectedTextAreas(side: HorizontalDirection) {
		return this.startGesture(new ResizeTextAreasGesture(this.stack, { side }));
	}

	private startGesture<T extends Gesture>(gesture: T): GestureHandle<T> {
		if (this.ui.activeGesture) {
			throw new Error('A different gesture is already in progress');
		}

		const wrappedGesture: GestureHandle<T> = {
			state: gesture,

			complete: () => {
				if (gesture.isOver) return;

				this.ui.activeGesture = null;
				gesture.complete();
			},

			cancel: () => {
				if (gesture.isOver) return;

				this.ui.activeGesture = null;
				gesture.cancel();
			}
		};

		this.ui.activeGesture = wrappedGesture;
		return wrappedGesture;
	}
}
