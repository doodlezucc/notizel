import { type ID } from '$lib/data/common';
import type { TextBoxLayout } from '$lib/data/vault';
import type { OmitFromUnion } from '$lib/util/types';
import { UICommandsGestures } from './commands/ui-commands-gestures';
import { UICommandsIO } from './commands/ui-commands-io';
import { UICommandsSelection } from './commands/ui-commands-selection';
import { type LiveTextCanvasObject } from './live-objects';
import { StackUser } from './stack/stack-user';
import { UIGeneralEditingScope, UITextAreaEditingScope } from './ui-editing-scope.svelte';

export class UICommands extends StackUser {
	readonly gestures = new UICommandsGestures(this.stack);
	readonly io = new UICommandsIO(this.stack);
	readonly selection = new UICommandsSelection(this.stack);

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

	createTextArea(props: OmitFromUnion<LiveTextCanvasObject, 'id' | 'type' | 'editor'>) {
		const objectId = crypto.randomUUID(); // Maybe swap this out with a simple incremental ID

		const newObject: LiveTextCanvasObject = {
			...props,
			id: objectId,
			type: 'text',
			editor: this.stack.liveObjectInstantiator.createTiptapEditor('')
		};

		const previousScope = this.ui.editingScope;

		this.history.execute('Add text area', () => {
			this.ui.objects.push(newObject);
			this.ui.editingScope = new UITextAreaEditingScope(objectId);

			return () => {
				this.ui.editingScope = previousScope;
				this.ui.objects = this.ui.objects.filter((object) => object.id !== objectId);
			};
		});
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

	enterTextAreaEditingScope(textObjectId: ID) {
		const previousScope = this.ui.editingScope;

		this.history.execute('Enter text editing', () => {
			this.ui.editingScope = new UITextAreaEditingScope(textObjectId);

			return () => {
				this.ui.editingScope = previousScope;
			};
		});
	}

	submitTextAreaLayout(objectId: ID, layout: TextBoxLayout) {
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject || textObject.type !== 'text') {
			throw new Error('Object is not a text area');
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, type, editor, ...previousLayout } = textObject;

		this.history.execute('Change textbox layout', () => {
			Object.assign(textObject, layout);

			return () => {
				Object.assign(textObject, previousLayout);
			};
		});
	}
}
