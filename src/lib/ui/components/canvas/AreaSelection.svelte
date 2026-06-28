<script lang="ts">
	import { type Vector } from '$lib/data/common';
	import { AreaSelectGesture } from '$lib/ui/state/gestures/area-select.svelte';
	import { type GestureHandle } from '$lib/ui/state/gestures/gestures';
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';

	const ui = useUI();

	let activeGesture = $state<GestureHandle<AreaSelectGesture> | null>(null);
	let scheduledUpdate: number | null = null;

	let currentPointerPosition = $state() as Vector;

	export function start(ev: PointerEvent) {
		if (ui.editingScope instanceof UIGeneralEditingScope && ui.activeGesture === null) {
			currentPointerPosition = { x: ev.clientX, y: ev.clientY };

			activeGesture = ui.commands.gestures.startAreaSelecting(currentPointerPosition, {
				deselectOthers: !ev.shiftKey
			});
		}
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeGesture) return;

		currentPointerPosition = { x: ev.clientX, y: ev.clientY };

		if (scheduledUpdate === null) {
			scheduledUpdate = requestAnimationFrame(() => {
				activeGesture?.state.updatePointerPosition(currentPointerPosition);
				scheduledUpdate = null;
			});
		}
	}

	function onPointerUp() {
		if (!activeGesture) return;

		activeGesture.complete();
		activeGesture = null;
	}
</script>

<svelte:window onpointermove={(ev) => onPointerMove(ev)} onpointerup={() => onPointerUp()} />

{#if activeGesture}
	{@const boundingBox = activeGesture.state.area}

	{#if boundingBox.size.width > 0 || boundingBox.size.height > 0}
		<div
			class="area"
			style:--x="{boundingBox.topLeft.x}px"
			style:--y="{boundingBox.topLeft.y}px"
			style:--w="{boundingBox.size.width}px"
			style:--h="{boundingBox.size.height}px"
		></div>
	{/if}
{/if}

<style lang="scss">
	@use '$lib/ui/style/scheme.scss';

	.area {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--w);
		height: var(--h);

		outline: 1px solid scheme.$primary;
		background-color: hsla(from scheme.$primary h s l / 0.15);
	}
</style>
