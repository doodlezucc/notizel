export type ID = string;

export type LogicalAlignment = 'start' | 'center' | 'end';

export type DynamicWidthTextAlignment = LogicalAlignment;
export type FixedWidthTextAlignment = LogicalAlignment | 'justify';

export type VerticalAlignment = 'top' | 'center' | 'bottom';

export interface Vector {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}
