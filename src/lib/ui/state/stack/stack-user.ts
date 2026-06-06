import { UIGeneralEditingScope } from '../ui-editing-scope.svelte';
import type { DependencyStack } from './dependency-stack';

export abstract class StackUser {
	protected readonly stack: DependencyStack;

	constructor(stack: DependencyStack) {
		this.stack = stack;
	}

	protected get ui() {
		return this.stack.ui;
	}

	protected get history() {
		return this.stack.history;
	}

	protected requireGeneralEditingScope(): UIGeneralEditingScope {
		return this.ui.requireGeneralEditingScope();
	}
}
