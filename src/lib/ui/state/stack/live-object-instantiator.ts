import type { ID } from '$lib/data/common';
import type { Content as TiptapContent } from '@tiptap/core';
import type { GenerateIdOptions, LiveObjectInstantiator } from '../live-objects';
import { createTiptapEditor } from '../tiptap/editor';
import { StackUser } from './stack-user';

export class StackLiveObjectInstantiator extends StackUser implements LiveObjectInstantiator {
	private readonly allocatedIds = new Set<ID>();

	private isIdUsed(id: ID): boolean {
		return this.allocatedIds.has(id);
	}

	private static generateAnyId(): ID {
		return crypto.randomUUID(); // Maybe swap this out with a simple incremental ID
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
}
