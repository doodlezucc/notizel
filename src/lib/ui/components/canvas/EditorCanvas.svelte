<script lang="ts">
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import UITextAreaObject from '../text-area/UITextAreaObject.svelte';
	import EditorCanvasBackground from './EditorCanvasBackground.svelte';
	import EditorCanvasInputScope from './EditorCanvasInputScope.svelte';
	import InfiniteCanvas from './InfiniteCanvas.svelte';

	const ui = useUI();
</script>

<EditorCanvasInputScope>
	<InfiniteCanvas
		bind:transform={ui.canvas.camera}
		onBackgroundTap={() => {
			ui.stopEditing();
			ui.selection.clear();
		}}
		onBackgroundDoubleTap={(ev) => {
			ui.addTextAreaObject(ev.pointerInCanvasSpace);
		}}
	>
		{#snippet background()}
			<EditorCanvasBackground transform={ui.canvas.camera} />
		{/snippet}

		{#each ui.canvas.objects as object, index (object.id)}
			<UITextAreaObject bind:object={ui.canvas.objects[index]} />
		{/each}
	</InfiniteCanvas>
</EditorCanvasInputScope>
