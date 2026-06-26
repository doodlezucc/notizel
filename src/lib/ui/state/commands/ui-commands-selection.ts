import type { ID } from '$lib/data/common';
import { StackUser } from '../stack/stack-user';

export class UICommandsSelection extends StackUser {
	select(ids: Iterable<ID>, { deselectOthers }: { deselectOthers: boolean }) {
		const idsToSelect = new Set(ids);

		for (const object of this.ui.objects) {
			if (object.type === 'text' && idsToSelect.has(object.id)) {
				this.ui.inferDefaultTextAreaAlignmentFrom(object);
				break;
			}
		}

		this.registerSelectionChange('Select', (currentSelection) => {
			if (deselectOthers) {
				return idsToSelect;
			} else {
				return currentSelection.union(idsToSelect);
			}
		});
	}

	deselect(id: ID) {
		this.registerSelectionChange('Deselect', (currentSelection) => {
			const newSelection = new Set(currentSelection);
			newSelection.delete(id);
			return newSelection;
		});
	}

	deselectAll() {
		this.registerSelectionChange('Deselect all', () => new Set());
	}

	private registerSelectionChange(
		message: string,
		modifySelection: (set: ReadonlySet<ID>) => Set<ID>
	) {
		const scope = this.requireGeneralEditingScope();
		const previousSelection = new Set(scope.selectedIds);
		const newSelection = modifySelection(scope.selectedIds);

		if (previousSelection.symmetricDifference(newSelection).size === 0) {
			// Selection stays the same, therefore no history change should get registered.
			return;
		}

		this.history.execute(message, () => {
			this.ui.applySelection(newSelection);

			return () => {
				this.ui.applySelection(previousSelection);
			};
		});
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
}
