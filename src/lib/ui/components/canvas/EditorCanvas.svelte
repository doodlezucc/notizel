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
		bind:transform={ui.camera}
		onBackgroundTap={() => {
			ui.stopEditing();
			ui.selection.clear();
		}}
		onBackgroundDoubleTap={(ev) => {
			ui.addTextAreaObject(ev.pointerInCanvasSpace);
		}}
	>
		{#snippet background()}
			<EditorCanvasBackground transform={ui.camera} />
		{/snippet}

		{#each ui.objects as object, index (object.id)}
			<UITextAreaObject bind:object={ui.objects[index]} />
		{/each}
	</InfiniteCanvas>
</EditorCanvasInputScope>
