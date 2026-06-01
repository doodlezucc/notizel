import type { ID } from '$lib/data/common';
import type { Content } from '@tiptap/core';

export type UIEditingScope = UITextAreaEditingScope;

export interface UITextAreaEditingScope {
	type: 'text';
	objectId: ID;
	originalContent: Content;
	wasJustCreated: boolean;
}
