import type { Content as TiptapContent } from '@tiptap/core';
import type { Temporal } from 'temporal-polyfill';
import type {
	CameraTransform,
	DynamicWidthTextAlignment,
	FixedWidthTextAlignment,
	ID,
	Vector,
	VerticalAlignment
} from './common';

export interface Vault {
	files: VaultFileMeta[];
}

export interface VaultFileMeta {
	id: ID;
	name: string;
	createdAt: Temporal.Instant;
	modifiedAt: Temporal.Instant;
}

export interface CanvasFileData {
	camera: CameraTransform;
	objects: CanvasObject[];
}

export type CanvasObject = TextCanvasObject;

export type TextCanvasObject = {
	id: ID;
	type: 'text';

	content: TiptapContent;
} & TextBoxLayout;

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
