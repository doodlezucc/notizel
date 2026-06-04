import type { ID } from '$lib/data/common';
import { SvelteSet } from 'svelte/reactivity';

export type UIEditingScope = UIGeneralEditingScope | UITextAreaEditingScope;

export class UIGeneralEditingScope {
	readonly selectedIds: SvelteSet<ID>;

	constructor(selectedIds: ID[]) {
		this.selectedIds = new SvelteSet<ID>(selectedIds);
	}
}

export class UITextAreaEditingScope {
	readonly objectId: ID;

	constructor(objectId: ID) {
		this.objectId = objectId;
	}
}
