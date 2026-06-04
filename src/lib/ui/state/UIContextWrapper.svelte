<script lang="ts" module>
	import type { CameraTransform, ID } from '$lib/data/common';
	import { UICommands } from './ui-commands';
	import { UIGeneralEditingScope } from './ui-editing-scope.svelte';
	import { type UIContext, UIState } from './ui-state.svelte';

	const CONTEXT_KEY = Symbol();

	export function useUI() {
		return getContext<UIContext>(CONTEXT_KEY);
	}

	class UIContextImpl implements UIContext {
		private readonly ui: UIState;

		readonly commands: UICommands;

		constructor(ui: UIState) {
			this.ui = ui;
			this.commands = new UICommands(ui);
		}

		get camera() {
			return this.ui.camera;
		}

		set camera(camera: CameraTransform) {
			this.ui.camera = camera;
		}

		readonly objects = $derived.by(() => this.ui.objects);
		readonly editingScope = $derived.by(() => this.ui.editingScope);
		readonly selectedIds = $derived.by<ReadonlySet<ID>>(() => {
			const scope = this.editingScope;
			if (scope instanceof UIGeneralEditingScope) {
				return scope.selectedIds;
			} else {
				return new Set();
			}
		});
	}
</script>

<script lang="ts">
	import { getContext, setContext, type Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const uiContext = new UIContextImpl(new UIState());

	setContext<UIContext>(CONTEXT_KEY, uiContext);
</script>

{@render children()}
