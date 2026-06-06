<script lang="ts">
	import { AxisAlignedBoundingBox, type Vector } from '$lib/data/common';
	import type { AreaSelectGesture } from '$lib/ui/state/ui-commands';
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';

	const ui = useUI();

	let activeGesture = $state<AreaSelectGesture | null>(null);
	let scheduledUpdate: number | null = null;

	let currentPointerPosition = $state() as Vector;

	export function start(ev: PointerEvent) {
		if (ui.editingScope instanceof UIGeneralEditingScope && ui.activeGesture === null) {
			currentPointerPosition = { x: ev.clientX, y: ev.clientY };
			activeGesture = ui.commands.startAreaSelecting(currentPointerPosition);
		}
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeGesture) return;

		currentPointerPosition = { x: ev.clientX, y: ev.clientY };

		if (scheduledUpdate === null) {
			scheduledUpdate = requestAnimationFrame(() => {
				activeGesture?.updatePointerPosition(currentPointerPosition);
				scheduledUpdate = null;
			});
		}
	}

	function onPointerUp() {
		if (!activeGesture) return;

		activeGesture.submit();
		activeGesture = null;
	}
</script>

<svelte:window onpointermove={(ev) => onPointerMove(ev)} onpointerup={() => onPointerUp()} />

{#if activeGesture}
	{@const boundingBox = AxisAlignedBoundingBox.fromPoints(
		activeGesture.initialPointerPosition,
		currentPointerPosition
	)}

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
	.area {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--w);
		height: var(--h);

		outline: 1px solid #ff4444;
		background-color: #ff444422;
	}
</style>
