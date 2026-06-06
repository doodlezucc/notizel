<script lang="ts">
	import type { Vector } from '$lib/data/common';
	import type { AreaSelectGesture } from '$lib/ui/state/ui-commands';
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';

	const ui = useUI();

	let activeGesture: AreaSelectGesture | null = null;
	let scheduledUpdate: number | null = null;
	let currentPointerPosition!: Vector;

	export function start(ev: PointerEvent) {
		if (ui.editingScope instanceof UIGeneralEditingScope && ui.activeGesture === null) {
			activeGesture = ui.commands.startAreaSelecting({ x: ev.clientX, y: ev.clientY });
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
