import type { ID } from '$lib/data/common';
import { extractLayout, type TextBoxLayout } from '$lib/data/text-box-layout';
import type { OmitFromUnion } from '$lib/util/types';
import type { LiveTextCanvasObject } from '../live-objects';
import { StackUser } from '../stack/stack-user';
import { UITextAreaEditingScope } from '../ui-editing-scope.svelte';

export class UICommandsTextObjects extends StackUser {
	create(props: OmitFromUnion<LiveTextCanvasObject, 'id' | 'type' | 'editor'>) {
		const objectId = this.stack.liveObjectInstantiator.generateId();

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

	enterEditing(objectId: ID) {
		const previousScope = this.ui.editingScope;

		this.history.execute('Enter text editing', () => {
			this.ui.editingScope = new UITextAreaEditingScope(objectId);

			return () => {
				this.ui.editingScope = previousScope;
			};
		});
	}

	setTextLayout(objectId: ID, layout: TextBoxLayout) {
		const textObject = this.ui.objects.find((object) => object.id === objectId);

		if (!textObject || textObject.type !== 'text') {
			throw new Error('Object is not a text area');
		}

		const previousLayout = extractLayout(textObject);

		this.history.execute('Change textbox layout', () => {
			Object.assign(textObject, layout);

			return () => {
				Object.assign(textObject, previousLayout);
			};
		});
	}
}
