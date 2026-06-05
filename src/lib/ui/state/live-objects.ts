import type { CanvasObject, TextCanvasObject } from '$lib/data/vault';
import type { OmitFromUnion } from '$lib/util/types';
import { Editor as TiptapEditor, type Content as TiptapContent } from '@tiptap/core';

export type LiveCanvasObject = LiveTextCanvasObject;

export type LiveTextCanvasObject = OmitFromUnion<TextCanvasObject, 'content'> & {
	editor: TiptapEditor;
};

type ObjectType = CanvasObject['type'] & LiveCanvasObject['type'];

export interface LiveObjectInstantiator {
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
