import type { ID } from '$lib/data/common';
import { convertClipboardToObjects, convertObjectsToClipboard } from '../clipboard/clipboard';
import { type LiveCanvasObject } from '../live-objects';
import { StackUser } from '../stack/stack-user';

export class UICommandsClipboard extends StackUser {
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

		const clipboardItem = convertObjectsToClipboard({
			objects: selectedObjects,
			domBridge: this.stack.domBridge
		});

		if (deleteObjects) {
			this.deleteObjectsViaCut(selectedObjects);
		}

		await navigator.clipboard.write([clipboardItem]);
	}

	private deleteObjectsViaCut(cutObjects: LiveCanvasObject[]) {
		const cutIds = new Set(cutObjects.map((object) => object.id));

		const message = cutIds.size === 1 ? 'Cut object' : `Cut ${cutIds.size} objects`;

		this.history.execute(message, () => {
			this.ui.applySelection(new Set());
			this.ui.objects = this.ui.objects.filter((object) => !cutIds.has(object.id));

			return () => {
				this.ui.objects.push(...cutObjects);
				this.ui.applySelection(cutIds);
			};
		});
	}

	async pasteFromClipboard(data: DataTransfer) {
		const newObjects = await convertClipboardToObjects({
			clipboardData: data,
			liveObjectInstantiator: this.stack.liveObjectInstantiator
		});

		if (newObjects !== null) {
			for (const object of newObjects) {
				// TODO: Add a central point to generate unused IDs
				// TODO: The central point should be able to generate a BATCH of new IDs,
				// which must not overlap, in addition to not overlapping with existing objects.
				object.id = crypto.randomUUID();
			}

			this.pasteObjects(newObjects);
		}
	}

	private pasteObjects(newObjects: LiveCanvasObject[]) {
		const scope = this.requireGeneralEditingScope();
		const previousSelection = new Set(scope.selectedIds);

		const newIds = new Set<ID>(newObjects.map((object) => object.id));

		this.history.execute('Paste from clipboard', () => {
			this.requireGeneralEditingScope();
			this.ui.objects.push(...newObjects);
			this.ui.applySelection(newIds);

			return () => {
				this.ui.applySelection(previousSelection);
				this.ui.objects = this.ui.objects.filter((object) => !newIds.has(object.id));
			};
		});
	}
}
