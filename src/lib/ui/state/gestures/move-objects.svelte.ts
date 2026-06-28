import { Vectors, type ID, type Vector } from '$lib/data/common';
import type { DependencyStack } from '../stack/dependency-stack';
import { Gesture } from './gestures';

export class MoveObjectsGesture extends Gesture {
	private readonly affectedIds: Set<ID>;
	private totalOffset: Vector = { x: 0, y: 0 };

	constructor(stack: DependencyStack) {
		super(stack);

		const scope = this.requireGeneralEditingScope();
		this.affectedIds = new Set(scope.selectedIds);
	}

	moveObjectsBy(offset: Vector) {
		if (this.isOver) return;

		this.ui.moveObjectsByOffset(this.affectedIds, offset);
		this.totalOffset = Vectors.add(this.totalOffset, offset);
	}

	protected onComplete() {
		const objectCount = this.affectedIds.size;
		const message = objectCount === 1 ? 'Move object' : `Move ${objectCount} objects`;

		this.history.execute(message, ({ isRedo }) => {
			if (isRedo) {
				this.ui.moveObjectsByOffset(this.affectedIds, this.totalOffset);
			}

			return () => {
				this.ui.moveObjectsByOffset(this.affectedIds, Vectors.negate(this.totalOffset));
			};
		});
	}

	protected onCancel() {
		this.ui.moveObjectsByOffset(this.affectedIds, Vectors.negate(this.totalOffset));
	}
}
