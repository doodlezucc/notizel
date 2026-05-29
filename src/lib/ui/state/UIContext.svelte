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

	const uiCanvasState = new UICanvasState({
		camera: {
			position: { x: 0, y: 0 },
			scale: 1
		},
		objects: [
			{
				id: 'whatevs',
				type: 'text',
				content: `
					<h1>notizel</h1>
					<p>Note taking and doodling.</p>
				`,
				anchor: { x: 0, y: 0 },
				alignH: 'justify',
				alignV: 'bottom',
				fixedWidth: 400
			}
		]
	});

	setContext<UICanvasState>(CONTEXT_KEY, uiCanvasState);
</script>

{@render children()}
