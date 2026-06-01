import type { ID } from '$lib/data/common';
import { SvelteSet } from 'svelte/reactivity';

export class UISelection {
	#selectedIds = new SvelteSet<ID>();
	#pivotId = $state<ID | null>(null);

	readonly selectedIds = $derived(this.#selectedIds) as ReadonlySet<ID>;
	readonly pivotId = $derived(this.#pivotId);

	select(id: ID, { deselectOthers }: { deselectOthers: boolean }) {
		if (deselectOthers) {
			this.#selectedIds.clear();
		}

		this.#selectedIds.add(id);
		this.#pivotId = id;
	}

	deselect(id: ID) {
		this.#selectedIds.delete(id);
		if (this.#pivotId === id) {
			this.#pivotId = null;
		}
	}

	set(selectedIds: Iterable<ID>) {
		this.#pivotId = null;
		this.#selectedIds.clear();

		for (const id of selectedIds) {
			this.#selectedIds.add(id);
		}
	}

	toggle(id: ID) {
		if (this.#selectedIds.delete(id)) {
			if (this.#pivotId === id) {
				this.#pivotId = null;
			}
		} else {
			// ID was not previously present in the set.
			this.#selectedIds.add(id);
		}
	}

	clear() {
		this.#selectedIds.clear();
		this.#pivotId = null;
	}
}
