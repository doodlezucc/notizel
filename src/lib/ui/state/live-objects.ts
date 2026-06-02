import type { CanvasObject, TextCanvasObject } from '$lib/data/vault';
import type { OmitFromUnion } from '$lib/util/types';
import { Editor as TiptapEditor, type Content as TiptapContent } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';

export type LiveCanvasObject = LiveTextCanvasObject;

export type LiveTextCanvasObject = OmitFromUnion<TextCanvasObject, 'content'> & {
	editor: TiptapEditor;
};

export function createTextAreaEditor(content: TiptapContent) {
	return new TiptapEditor({
		extensions: [StarterKit],
		content
	});
}

type ObjectType = CanvasObject['type'] & LiveCanvasObject['type'];

export function unfreezeCanvasObject<T extends ObjectType>(
	object: CanvasObject & { type: T }
): LiveCanvasObject & { type: T } {
	switch (object.type) {
		case 'text':
			return {
				...object,
				editor: new TiptapEditor({
					content: object.content
				})
			};
	}
}

export function freezeCanvasObject<T extends ObjectType>(
	object: LiveCanvasObject & { type: T }
): CanvasObject & { type: T } {
	switch (object.type) {
		case 'text':
			return {
				...object,
				content: object.editor.getJSON()
			};
	}
}
