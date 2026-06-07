import type { ID } from '$lib/data/common';
import type { CanvasObject } from '$lib/data/vault';
import type { Content as TiptapContent } from '@tiptap/core';
import { nanoid } from 'nanoid';
import type {
	GenerateIdOptions,
	LiveCanvasObject,
	LiveObjectInstantiator,
	ObjectType
} from '../live-objects';
import { createTiptapEditor } from '../tiptap/editor';
import { StackUser } from './stack-user';

export class StackLiveObjectInstantiator extends StackUser implements LiveObjectInstantiator {
	private readonly allocatedIds = new Set<ID>();

	private isIdUsed(id: ID): boolean {
		return this.allocatedIds.has(id);
	}

	private static generateAnyId(): ID {
		return nanoid(7);
	}

	generateId(options: GenerateIdOptions = {}): ID {
		const { preferred } = options;

		let id = preferred ?? StackLiveObjectInstantiator.generateAnyId();
		while (this.isIdUsed(id)) {
			id = StackLiveObjectInstantiator.generateAnyId();
		}

		this.allocatedIds.add(id);
		return id;
	}

	createTiptapEditor(initialContent: TiptapContent) {
		return createTiptapEditor({
			initialContent,
			registerHistoryChange: (change) => this.history.execute('Edit text', change)
		});
	}

	unfreezeCanvasObject<T extends ObjectType>(
		object: CanvasObject & { type: T }
	): LiveCanvasObject & { type: T } {
		switch (object.type) {
			case 'text':
				return {
					...object,
					id: this.generateId({ preferred: object.id }),
					editor: this.createTiptapEditor(object.content)
				};
		}
	}
}
