import type { AxisAlignedBoundingBox, ID, Vector } from '$lib/data/common';

export interface ObjectTransformGestureHandle {
	moveObjectsBy(offset: Vector): void;
}

export interface AreaSelectGestureHandle {
	updatePointerPosition(clientSpace: Vector): void;
}

export type GestureState = AreaSelectGestureState;

export abstract class AreaSelectGestureState {
	abstract readonly area: AxisAlignedBoundingBox;
	abstract readonly idsInArea: ReadonlySet<ID>;
}

export interface CreateHandleContext {
	isComplete(): boolean;
}

export interface CreateGestureOptions {
	onComplete?: () => void;
	onCancel?: () => void;
}

export type ControlledGestureHandle<T = unknown> = T & {
	complete(): void;
	cancel(): void;
};

export function createGesture<T>(
	createHandle: (context: CreateHandleContext) => T,
	options: CreateGestureOptions = {}
): ControlledGestureHandle<T> {
	let isComplete = false;

	return {
		...createHandle({
			isComplete: () => isComplete
		}),

		complete: () => {
			if (isComplete) return;
			isComplete = true;

			options.onComplete?.();
		},

		cancel: () => {
			if (isComplete) return;
			isComplete = true;

			options.onCancel?.();
		}
	};
}
