<script lang="ts">
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import UITextAreaObject from '../text-area/UITextAreaObject.svelte';
	import AreaSelection from './AreaSelection.svelte';
	import EditorCanvasBackground from './EditorCanvasBackground.svelte';
	import EditorCanvasInputScope from './EditorCanvasInputScope.svelte';
	import InfiniteCanvas from './InfiniteCanvas.svelte';

	const ui = useUI();

	let areaSelection = $state<AreaSelection>();
</script>

<EditorCanvasInputScope>
	<InfiniteCanvas
		bind:transform={ui.camera}
		onBackgroundPrimaryPointerDownRaw={(ev) => areaSelection?.start(ev)}
		onBackgroundTap={() => {
			ui.commands.cancelActiveGesture();
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

	<AreaSelection bind:this={areaSelection} />
</EditorCanvasInputScope>
