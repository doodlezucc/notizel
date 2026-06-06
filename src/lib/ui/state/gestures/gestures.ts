import type { AxisAlignedBoundingBox, ID, Vector } from '$lib/data/common';

export interface GestureHandle {
	submit(): void;
	cancel(): void;
}

export interface ObjectTransformGestureHandle extends GestureHandle {
	moveObjectsBy(offset: Vector): void;
}

export interface AreaSelectGestureHandle extends GestureHandle {
	updatePointerPosition(clientSpace: Vector): void;
}

export type GestureState = AreaSelectGestureState;

export abstract class AreaSelectGestureState {
	abstract readonly area: AxisAlignedBoundingBox;
	abstract readonly idsInArea: ReadonlySet<ID>;
}
