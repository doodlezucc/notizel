import type {
	DynamicWidthTextAlignment,
	FixedWidthTextAlignment,
	Vector,
	VerticalAlignment
} from './common';

export type TextBoxLayout = {
	anchor: Vector;
} & TextBoxAlignment;

export type TextBoxAlignment = {
	/** This only decides in what vertical direction to scale the box when adding new lines of text. */
	alignV: VerticalAlignment;
} & (
	| { fixedWidth?: never; alignH: DynamicWidthTextAlignment }
	| { fixedWidth: number; alignH: FixedWidthTextAlignment }
);

export function extractLayout<T extends TextBoxLayout>(object: T): TextBoxLayout {
	const { alignH, alignV, anchor, fixedWidth } = object;

	return { alignH, alignV, anchor, fixedWidth } as TextBoxLayout;
}
