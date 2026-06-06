import { UICommandsGestures } from './commands/ui-commands-gestures';
import { UICommandsIO } from './commands/ui-commands-io';
import { UICommandsSelection } from './commands/ui-commands-selection';
import { UICommandsTextObjects } from './commands/ui-commands-text-objects';
import { StackUser } from './stack/stack-user';
import { UIGeneralEditingScope, UITextAreaEditingScope } from './ui-editing-scope.svelte';

export class UICommands extends StackUser {
	readonly gestures = new UICommandsGestures(this.stack);
	readonly io = new UICommandsIO(this.stack);
	readonly selection = new UICommandsSelection(this.stack);
	readonly textObjects = new UICommandsTextObjects(this.stack);

	undo() {
		if (this.gestures.hasActiveGesture) {
			this.gestures.cancelActive();
			return null;
		}

		return this.history.undo();
	}

	redo() {
		if (this.gestures.hasActiveGesture) {
			return null;
		}

		return this.history.redo();
	}

	exitCurrentScope() {
		if (this.gestures.hasActiveGesture) {
			this.gestures.cancelActive();
			return;
		}

		const scope = this.ui.editingScope;
		if (scope instanceof UITextAreaEditingScope) {
			this.exitTextAreaScope(scope);
		} else if (scope instanceof UIGeneralEditingScope) {
			this.selection.deselectAll();
		}
	}

	private exitTextAreaScope(scope: UITextAreaEditingScope) {
		const { objectId } = scope;
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject) return;

		if (textObject.editor.isEmpty) {
			// Auto-delete empty text area

			// Set last editor content to what it was just before clearing
			textObject.editor.commands.undo();

			this.history.execute('Remove empty text area', () => {
				this.ui.editingScope = new UIGeneralEditingScope([]);
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);

				return () => {
					this.ui.objects.push(textObject);
					this.ui.editingScope = scope;
				};
			});
		} else {
			this.history.execute('Exit text editing', () => {
				this.ui.editingScope = new UIGeneralEditingScope([objectId]);

				return () => {
					this.ui.editingScope = scope;
				};
			});
		}
	}
}
