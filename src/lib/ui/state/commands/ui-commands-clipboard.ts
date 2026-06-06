import { freezeCanvasObject, type LiveCanvasObject } from '../live-objects';
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

		const clipboardItem = this.convertObjectsToClipboard(selectedObjects);

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

	private convertObjectsToClipboard(objects: LiveCanvasObject[]): ClipboardItem {
		const frozenObjects = objects.map(freezeCanvasObject);

		const textObjects = objects
			.filter((object) => object.type === 'text')
			.map((object) => {
				const domHandle = this.stack.domBridge.getHandle(object.id);

				const centerOfTextArea = domHandle?.computeBoundsInClientSpace().center ?? object.anchor;

				return { object, centerOfTextArea };
			});

		// Sort text objects by their vertical center for a somewhat
		// coherent order in the plain text clipboard.
		textObjects.sort((a, b) => {
			return a.centerOfTextArea.y - b.centerOfTextArea.y;
		});

		const clipboardItemText = textObjects.map(({ object }) => object.editor.getText()).join('\n');

		// This is of course not valid HTML. But other MIME types like "application/json" may not be
		// supported by all browsers.
		// Figma embeds some encoded data inside HTML comments, which seems like it's more safe.
		// But for now this simply puts a JSON string into the HTML clipboard item.
		const clipboardItemHtml = JSON.stringify(frozenObjects);

		return new ClipboardItem({
			'text/plain': clipboardItemText,
			'text/html': clipboardItemHtml
		});
	}
}
