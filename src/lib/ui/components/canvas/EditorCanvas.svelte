<script lang="ts">
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import UITextAreaObject from '../text-area/UITextAreaObject.svelte';
	import EditorCanvasBackground from './EditorCanvasBackground.svelte';
	import InfiniteCanvas from './InfiniteCanvas.svelte';

	const ui = useUI();
</script>

<InfiniteCanvas
	bind:transform={ui.canvas.camera}
	onBackgroundTap={() => {
		console.log('background tap');
		ui.selection.clear();
	}}
>
	{#snippet background()}
		<EditorCanvasBackground />
	{/snippet}

	{#each ui.canvas.objects as object (object.id)}
		<UITextAreaObject bind:object />
	{/each}
</InfiniteCanvas>
