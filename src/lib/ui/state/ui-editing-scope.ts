import type { ID } from '$lib/data/common';

export type UIEditingScope = UITextAreaEditingScope;

export interface UITextAreaEditingScope {
	type: 'text';
	objectId: ID;
}
