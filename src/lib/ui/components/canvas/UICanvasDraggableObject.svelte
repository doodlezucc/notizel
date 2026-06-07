<script lang="ts">
	import { Vectors, type ID, type Vector } from '$lib/data/common';
	import {
		AreaSelectGestureState,
		type ControlledGestureHandle,
		type ObjectTransformGestureHandle
	} from '$lib/ui/state/gestures/gestures';
	import type { MountedObject } from '$lib/ui/state/ui-dom-bridge';
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import { onMount, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	interface ChildContext {
		isInAreaSelection: boolean;
		draggableEvents: Attachment<HTMLElement>;
	}

	interface Props {
		objectId: ID;
		mountedObject: MountedObject;
		ignoreDragging?: boolean;
		content: Snippet<[ChildContext]>;
	}

	let { objectId, mountedObject, ignoreDragging = false, content }: Props = $props();

	const ui = useUI();

	let isSelected = $derived(ui.selectedIds.has(objectId));

	interface DraggingContext {
		gesture: ControlledGestureHandle<ObjectTransformGestureHandle>;
		previousPointer: Vector;
		hasMovedAtAll: boolean;
	}

	let activeDragging: DraggingContext | undefined;

	function onPointerDown(ev: PointerEvent) {
		if (ignoreDragging || !(ui.editingScope instanceof UIGeneralEditingScope)) return;

		if (ev.button !== 0) {
			// Only handle primary pointer events
			return;
		}

		ev.preventDefault();

		if (!isSelected) {
			ui.commands.selection.select([objectId], { deselectOthers: !ev.shiftKey });
		}

		activeDragging = {
			gesture: ui.commands.gestures.startMovingSelectedObjects(),
			previousPointer: { x: ev.screenX, y: ev.screenY },
			hasMovedAtAll: false
		};
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeDragging) return;

		const pointer: Vector = { x: ev.screenX, y: ev.screenY };

		const pointerDelta = Vectors.subtract(pointer, activeDragging.previousPointer);
		const offset = Vectors.scale(pointerDelta, 1 / ui.camera.scale);

		activeDragging.gesture.moveObjectsBy(offset);

		activeDragging.previousPointer = pointer;
		activeDragging.hasMovedAtAll = true;
	}

	function onPointerUp() {
		if (!activeDragging) return;

		if (activeDragging.hasMovedAtAll) {
			activeDragging.gesture.complete();
		} else {
			activeDragging.gesture.cancel();
		}

		activeDragging = undefined;
	}

	function createDraggableAttachment(): Attachment<HTMLElement> {
		return (element) => {
			element.addEventListener('pointerdown', onPointerDown);

			return () => {
				element.removeEventListener('pointerdown', onPointerDown);
			};
		};
	}

	onMount(() => {
		ui.bridge.registerMountedObject(objectId, mountedObject);

		return () => {
			ui.bridge.unregisterMountedObject(objectId);
		};
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

{@render content({
	isInAreaSelection:
		ui.activeGesture instanceof AreaSelectGestureState
			? ui.activeGesture.idsInArea.has(objectId)
			: false,
	draggableEvents: createDraggableAttachment()
})}
