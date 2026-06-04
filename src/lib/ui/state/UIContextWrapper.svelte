<script lang="ts" module>
	import type { CameraTransform } from '$lib/data/common';
	import { UICommands } from './ui-commands';
	import type { ReadonlyUISelection } from './ui-selection.svelte';
	import { type UIContext, UIState } from './ui-state.svelte';

	const CONTEXT_KEY = Symbol();

	export function useUI() {
		return getContext<UIContext>(CONTEXT_KEY);
	}

	class UIContextImpl implements UIContext {
		private readonly ui: UIState;

		readonly selection: ReadonlyUISelection;
		readonly commands: UICommands;

		constructor(ui: UIState) {
			this.ui = ui;
			this.selection = ui.selection;
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
