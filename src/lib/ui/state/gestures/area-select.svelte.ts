import {
	AxisAlignedBoundingBox,
	BoundingBoxes,
	type BoundingBox,
	type ID,
	type Vector
} from '$lib/data/common';
import type { DependencyStack } from '../stack/dependency-stack';
import { Gesture } from './gestures';

interface AreaSelectGestureContext {
	deselectOthers: boolean;
	initialPointer: Vector;
}

interface ObjectAreaSelectInformation {
	id: ID;
	bounds: BoundingBox;
}

export class AreaSelectGesture extends Gesture {
	private readonly selectionAtStart: Set<ID>;
	private readonly objects: ObjectAreaSelectInformation[];

	#area = $state() as AxisAlignedBoundingBox;
	#idsInArea = $state() as ReadonlySet<ID>;

	readonly area = $derived(this.#area);
	readonly idsInArea = $derived(this.#idsInArea);

	constructor(
		stack: DependencyStack,
		private readonly context: AreaSelectGestureContext
	) {
		super(stack);

		const scope = this.requireGeneralEditingScope();
		this.selectionAtStart = new Set(scope.selectedIds);

		// Collect information about object bounding boxes
		this.objects = [];
		for (const object of stack.ui.objects) {
			const handle = stack.domBridge.getHandle(object.id);

			if (handle) {
				this.objects.push({
					id: object.id,
					bounds: handle.computeBoundsInClientSpace()
				});
			}
		}

		this.updatePointerPosition(context.initialPointer);
	}

	updatePointerPosition(currentPointer: Vector): void {
		if (this.isOver) return;

		this.updateArea(AxisAlignedBoundingBox.fromPoints(this.context.initialPointer, currentPointer));
	}

	private updateArea(area: AxisAlignedBoundingBox) {
		this.#area = area;
		this.#idsInArea = new Set(
			this.objects
				.filter((object) => BoundingBoxes.checkOverlapping(area, object.bounds))
				.map((object) => object.id)
		);
	}

	protected onComplete(): void {
		const objectIdsInArea = new Set(this.idsInArea);

		const newSelection = this.context.deselectOthers
			? objectIdsInArea
			: objectIdsInArea.union(this.selectionAtStart);

		const isSelectionDifferent = newSelection.symmetricDifference(this.selectionAtStart).size > 0;

		if (isSelectionDifferent) {
			this.history.execute('Area select', () => {
				this.ui.applySelection(newSelection);

				return () => {
					this.ui.applySelection(this.selectionAtStart);
				};
			});
		}
	}

	protected onCancel(): void {}
}
