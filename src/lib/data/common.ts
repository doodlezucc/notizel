export type ID = string;

export type LogicalAlignment = 'start' | 'center' | 'end';

export type DynamicWidthTextAlignment = LogicalAlignment;
export type FixedWidthTextAlignment = LogicalAlignment | 'justify';

export type VerticalAlignment = 'top' | 'center' | 'bottom';

export interface Vector {
	x: number;
	y: number;
}

export const Vectors = {
	add: (a: Vector, b: Vector): Vector => {
		return { x: a.x + b.x, y: a.y + b.y };
	},
	subtract: (a: Vector, b: Vector): Vector => {
		return { x: a.x - b.x, y: a.y - b.y };
	},
	scale: ({ x, y }: Vector, scale: number): Vector => {
		return { x: x * scale, y: y * scale };
	}
};

export interface Size {
	width: number;
	height: number;
}

export interface CameraTransform {
	position: Vector;
	scale: number;
}
