<script lang="ts">
	import { Vectors, type ID, type Vector } from '$lib/data/common';
	import type { MountedObject } from '$lib/ui/state/dom-bridge/object';
	import { AreaSelectGesture } from '$lib/ui/state/gestures/area-select.svelte';
	import { type GestureHandle } from '$lib/ui/state/gestures/gestures';
	import type { MoveObjectsAsDuplicatesGesture } from '$lib/ui/state/gestures/move-objects-as-duplicates.svelte';
	import type { MoveObjectsGesture } from '$lib/ui/state/gestures/move-objects.svelte';
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import { onMount, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { CanvasInputSet } from './EditorCanvasInputScope.svelte';

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
		isStartOfSelection: boolean;
		isDuplicationGesture: boolean;
		gesture: GestureHandle<MoveObjectsGesture | MoveObjectsAsDuplicatesGesture>;
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

		const isStartOfSelection = !isSelected;
		if (!isSelected) {
			ui.commands.selection.select([objectId], { deselectOthers: !ev.shiftKey });
		}

		const isDuplicationGesture = CanvasInputSet.state.actions.modifierDuplicate.isPressed;

		activeDragging = {
			isStartOfSelection,
			isDuplicationGesture,
			gesture: isDuplicationGesture
				? ui.commands.gestures.startMovingSelectedObjectsAsDuplicates()
				: ui.commands.gestures.startMovingSelectedObjects(),
			previousPointer: { x: ev.screenX, y: ev.screenY },
			hasMovedAtAll: false
		};
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeDragging) return;

		const pointer: Vector = { x: ev.screenX, y: ev.screenY };

		const pointerDelta = Vectors.subtract(pointer, activeDragging.previousPointer);
		const offset = Vectors.scale(pointerDelta, 1 / ui.camera.scale);

		activeDragging.gesture.state.moveObjectsBy(offset);

		activeDragging.previousPointer = pointer;
		activeDragging.hasMovedAtAll = true;
	}

	function onPointerUp(ev: PointerEvent) {
		if (!activeDragging) return;

		// Duplicating objects should complete even if the new objects were not moved at all.
		if (activeDragging.hasMovedAtAll || activeDragging.isDuplicationGesture) {
			activeDragging.gesture.complete();
		} else {
			activeDragging.gesture.cancel();

			if (!activeDragging.hasMovedAtAll && !activeDragging.isStartOfSelection) {
				if (ev.shiftKey) {
					// CLICKING on an ALREADY SELECTED object while holding down shift deselects the object.
					ui.commands.selection.deselect(objectId);
				} else {
					// CLICKING on an ALREADY SELECTED object without shift deselects all other objects.
					ui.commands.selection.select([objectId], { deselectOthers: true });
				}
			}
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
		ui.activeGesture?.state instanceof AreaSelectGesture
			? ui.activeGesture.state.idsInArea.has(objectId)
			: false,
	draggableEvents: createDraggableAttachment()
})}
