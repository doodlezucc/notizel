import { type ID, type Vector } from '$lib/data/common';
import { freezeCanvasObject, type LiveTextCanvasObject } from '../live-objects';
import type { DependencyStack } from '../stack/dependency-stack';
import { Gesture } from './gestures';

export class MoveObjectsAsDuplicatesGesture extends Gesture {
	private readonly previousSelection: Set<ID>;
	private readonly newIds: Set<ID>;
	private newObjects: LiveTextCanvasObject[];

	constructor(stack: DependencyStack) {
		super(stack);

		const scope = this.requireGeneralEditingScope();
		this.previousSelection = new Set(scope.selectedIds);

		this.newObjects = this.ui.objects
			.filter((object) => this.previousSelection.has(object.id))
			.map((object) => freezeCanvasObject(object))
			.map((frozenObject) => this.stack.liveObjectInstantiator.unfreezeCanvasObject(frozenObject));

		this.newIds = new Set(this.newObjects.map((object) => object.id));
	}

	moveObjectsBy(offset: Vector) {
		if (this.isOver) return;

		this.ui.moveObjectsByOffset(this.newIds, offset);
	}

	protected onComplete() {
		// Update latest object changes for later redo.
		this.newObjects = this.ui.objects.filter((object) => this.newIds.has(object.id));

		const objectCount = this.newIds.size;
		const message = objectCount === 1 ? 'Duplicate object' : `Duplicate ${objectCount} objects`;

		this.history.execute(message, ({ isRedo }) => {
			if (isRedo) {
				this.addNewObjects();
			}

			return () => {
				this.removeNewObjects();
			};
		});
	}

	protected onCancel() {
		this.removeNewObjects();
	}

	private addNewObjects() {
		this.ui.objects.push(...this.newObjects);
		this.ui.applySelection(this.newIds);
	}

	private removeNewObjects() {
		this.ui.objects = this.ui.objects.filter((object) => !this.newIds.has(object.id));
		this.ui.applySelection(this.previousSelection);
	}
}
