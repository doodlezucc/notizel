import type { ID } from '$lib/data/common';
import type { Change } from '$lib/packages/history';
import { freezeCanvasObject } from '../live-objects';
import { StackUser } from '../stack/stack-user';

export class UICommandsSelection extends StackUser {
	select(ids: Iterable<ID>, { deselectOthers }: { deselectOthers: boolean }) {
		const idsToSelect = new Set(ids);

		this.history.execute(
			'Select',
			this.createSelectionChange((currentSelection) => {
				if (deselectOthers) {
					return idsToSelect;
				} else {
					return currentSelection.union(idsToSelect);
				}
			})
		);
	}

	toggle(id: ID) {
		this.history.execute(
			'Toggle select',
			this.createSelectionChange((currentSelection) => {
				const newSelection = new Set(currentSelection);

				if (!newSelection.delete(id)) {
					// ID was not previously present in the set.
					newSelection.add(id);
				}

				return newSelection;
			})
		);
	}

	private createSelectionChange(modifySelection: (set: ReadonlySet<ID>) => Set<ID>): Change {
		const scope = this.requireGeneralEditingScope();
		const previousSelection = new Set(scope.selectedIds);
		const newSelection = modifySelection(scope.selectedIds);

		return () => {
			this.ui.applySelection(newSelection);

			return () => {
				this.ui.applySelection(previousSelection);
			};
		};
	}

	deselectAll() {
		if (this.requireGeneralEditingScope().selectedIds.size === 0) {
			// Nothing is selected
			return;
		}

		this.history.execute(
			'Deselect all',
			this.createSelectionChange(() => new Set())
		);
	}

	deleteSelectedObjects() {
		const scope = this.requireGeneralEditingScope();

		const affectedIds = new Set(scope.selectedIds);
		if (affectedIds.size === 0) {
			return;
		}

		const message = affectedIds.size === 1 ? 'Remove object' : `Remove ${affectedIds.size} objects`;
		const affectedObjects = this.ui.objects.filter((object) => affectedIds.has(object.id));

		this.history.execute(message, () => {
			const scope = this.requireGeneralEditingScope();
			scope.selectedIds.clear();
			this.ui.objects = this.ui.objects.filter((object) => !affectedIds.has(object.id));

			return () => {
				const scope = this.requireGeneralEditingScope();
				this.ui.objects.push(...affectedObjects);

				for (const id of affectedIds) {
					scope.selectedIds.add(id);
				}
			};
		});
	}

	async cutSelectionToClipboard() {
		await this.writeSelectionToClipboard({ deleteObjects: true });
	}

	async copySelectionToClipboard() {
		await this.writeSelectionToClipboard({ deleteObjects: false });
	}

	private async writeSelectionToClipboard({ deleteObjects }: { deleteObjects: boolean }) {
		const scope = this.requireGeneralEditingScope();
		const selectedObjects = this.ui.objects.filter((object) => scope.selectedIds.has(object.id));

		if (selectedObjects.length === 0) {
			return;
		}

		const frozenCopies = selectedObjects.map((object) => {
			const frozen = freezeCanvasObject(object);
			frozen.id = crypto.randomUUID(); // TODO: Again, incremental IDs would be cooler

			return frozen;
		});

		if (deleteObjects) {
			this.deleteSelectedObjects();
		}

		const clipboardEntryJson = JSON.stringify(frozenCopies);
		await navigator.clipboard.writeText(clipboardEntryJson);
	}
}
