import type { Vector } from './math/vector';

export * from './math/bounding-box';
export * from './math/size';
export * from './math/vector';

export type ID = string;

export type LogicalAlignment = 'start' | 'center' | 'end';

export type DynamicWidthTextAlignment = LogicalAlignment;
export type FixedWidthTextAlignment = LogicalAlignment | 'justify';

export type VerticalAlignment = 'top' | 'center' | 'bottom';

export interface CameraTransform {
	position: Vector;
	scale: number;
}

export type HorizontalDirection = 'left' | 'right';
