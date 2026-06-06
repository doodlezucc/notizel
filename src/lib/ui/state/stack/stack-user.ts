import type { DependencyStack } from './dependency-stack';

export abstract class StackUser {
	private readonly stack: DependencyStack;

	constructor(stack: DependencyStack) {
		this.stack = stack;
	}

	protected get persistence() {
		return this.stack.persistence;
	}

	protected get ui() {
		return this.stack.ui;
	}

	protected get domBridge() {
		return this.stack.domBridge;
	}

	protected get history() {
		return this.stack.history;
	}
}
