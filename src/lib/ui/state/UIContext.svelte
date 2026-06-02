<script lang="ts" module>
	const CONTEXT_KEY = Symbol();

	export function useUI() {
		return getContext<UICanvasState>(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	import { getContext, setContext, type Snippet } from 'svelte';
	import { UICanvasState } from './ui-state.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const uiCanvasState = new UICanvasState();

	setContext<UICanvasState>(CONTEXT_KEY, uiCanvasState);
</script>

{@render children()}
