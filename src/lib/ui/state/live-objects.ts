import type { ID } from '$lib/data/common';
import type { CanvasObject, TextCanvasObject } from '$lib/data/vault';
import type { OmitFromUnion } from '$lib/util/types';
import { Editor as TiptapEditor, type Content as TiptapContent } from '@tiptap/core';

export type LiveCanvasObject = LiveTextCanvasObject;

export type LiveTextCanvasObject = OmitFromUnion<TextCanvasObject, 'content'> & {
	editor: TiptapEditor;
};

type ObjectType = CanvasObject['type'] & LiveCanvasObject['type'];

export interface GenerateIdOptions {
	/** If specified, this ID is checked first before generating a new one. */
	preferred?: ID;
}

export interface LiveObjectInstantiator {
	/**
	 * Returns a fresh, guaranteed unused ID for the current file.
	 */
	generateId(options?: GenerateIdOptions): ID;
	createTiptapEditor: (initialContent: TiptapContent) => TiptapEditor;
}

export function unfreezeCanvasObject<T extends ObjectType>(
	object: CanvasObject & { type: T },
	objectInstantiator: LiveObjectInstantiator
): LiveCanvasObject & { type: T } {
	switch (object.type) {
		case 'text':
			return {
				...object,
				id: objectInstantiator.generateId({ preferred: object.id }),
				editor: objectInstantiator.createTiptapEditor(object.content)
			};
	}
}

export function freezeCanvasObject<T extends ObjectType>(
	object: LiveCanvasObject & { type: T }
): CanvasObject & { type: T } {
	switch (object.type) {
		case 'text': {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { editor, ...commonProps } = object;

			return {
				...commonProps,
				content: object.editor.getJSON()
			};
		}
	}
}
