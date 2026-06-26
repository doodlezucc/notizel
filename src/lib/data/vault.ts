import type { Content as TiptapContent } from '@tiptap/core';
import type { Temporal } from 'temporal-polyfill';
import type { CameraTransform, ID } from './common';
import type { TextBoxLayout } from './text-box-layout';

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
