import type { AxisAlignedBoundingBox, ID, Vector } from '$lib/data/common';

export interface ObjectTransformGestureHandle {
	moveObjectsBy(offset: Vector): void;
}

export interface AreaSelectGestureHandle {
	updatePointerPosition(clientSpace: Vector): void;
}

export interface TextAreaResizeGestureHandle {
	resizeBy(offset: number): void;
}

export type GestureState = AreaSelectGestureState;

export abstract class AreaSelectGestureState {
	abstract readonly area: AxisAlignedBoundingBox;
	abstract readonly idsInArea: ReadonlySet<ID>;
}

export interface CreateHandleContext {
	isComplete(): boolean;
}

export interface CreateGestureOptions<T> {
	createHandle: (context: CreateHandleContext) => T;
	onComplete?: () => void;
	onCancel?: () => void;
}

export type ControlledGestureHandle<T = unknown> = T & {
	complete(): void;
	cancel(): void;
};

export function createGesture<T>(options: CreateGestureOptions<T>): ControlledGestureHandle<T> {
	let isComplete = false;

	return {
		...options.createHandle({
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
