import type { ID } from '$lib/data/common';
import { SvelteSet } from 'svelte/reactivity';

export class UISelection {
	#selectedIds = new SvelteSet<ID>();

	readonly selectedIds = $derived(this.#selectedIds) as ReadonlySet<ID>;

	set(selectedIds: Iterable<ID>) {
		this.#selectedIds.clear();

		for (const id of selectedIds) {
			this.#selectedIds.add(id);
		}
	}

	toggle(id: ID) {
		if (!this.#selectedIds.delete(id)) {
			// ID was not previously present in the set.
			this.#selectedIds.add(id);
		}
	}

	clear() {
		this.#selectedIds.clear();
	}
}
