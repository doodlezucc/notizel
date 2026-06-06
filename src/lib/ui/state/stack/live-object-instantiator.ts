import type { Content as TiptapContent } from '@tiptap/core';
import type { LiveObjectInstantiator } from '../live-objects';
import { createTiptapEditor } from '../tiptap/editor';
import { StackUser } from './stack-user';

export class StackLiveObjectInstantiator extends StackUser implements LiveObjectInstantiator {
	createTiptapEditor(initialContent: TiptapContent) {
		return createTiptapEditor({
			initialContent,
			registerHistoryChange: (change) => this.history.execute('Edit text', change)
		});
	}
}
