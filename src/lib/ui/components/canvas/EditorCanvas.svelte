<script lang="ts">
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import TextAreaObject from '../text-area/TextAreaObject.svelte';
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

	{#each ui.canvas.objects as object (object)}
		<TextAreaObject
			id={object.id}
			isEditing={ui.selection.selectedIds.has(object.id)}
			computeSize={(rect) => ({
				width: rect.width / ui.canvas.camera.scale,
				height: rect.height / ui.canvas.camera.scale
			})}
			bind:content={object.content}
			bind:anchor={object.anchor}
			bind:alignH={object.alignH}
			bind:alignV={object.alignV}
			bind:fixedWidth={object.fixedWidth}
		/>
	{/each}
</InfiniteCanvas>
