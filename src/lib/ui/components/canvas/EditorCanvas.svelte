<script lang="ts">
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import UITextAreaObject from '../text-area/UITextAreaObject.svelte';
	import { AreaSelectionManager } from './area-select';
	import EditorCanvasBackground from './EditorCanvasBackground.svelte';
	import EditorCanvasInputScope from './EditorCanvasInputScope.svelte';
	import InfiniteCanvas from './InfiniteCanvas.svelte';

	const ui = useUI();

	const areaSelectionManager = new AreaSelectionManager(ui);
</script>

<svelte:window
	onpointermove={(ev) => areaSelectionManager.onPointerMove(ev)}
	onpointerup={() => areaSelectionManager.onPointerUp()}
/>

<EditorCanvasInputScope>
	<InfiniteCanvas
		bind:transform={ui.camera}
		onBackgroundPrimaryPointerDownRaw={(ev) => areaSelectionManager.onPrimaryPointerDown(ev)}
		onBackgroundTap={() => {
			ui.commands.exitCurrentScope();
		}}
		onBackgroundDoubleTap={(ev) => {
			ui.commands.createTextArea({
				alignH: 'center',
				alignV: 'center',
				anchor: ev.pointerInCanvasSpace
			});
		}}
	>
		{#snippet background()}
			<EditorCanvasBackground transform={ui.camera} />
		{/snippet}

		{#each ui.objects as object (object.id)}
			<UITextAreaObject {object} />
		{/each}
	</InfiniteCanvas>
</EditorCanvasInputScope>
