<script lang="ts">
	import { Vectors, type ID, type Vector } from '$lib/data/common';
	import type { ObjectTransformGesture } from '$lib/ui/state/ui-commands';
	import { UIGeneralEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	interface ChildContext {
		draggableEvents: Attachment<HTMLElement>;
	}

	interface Props {
		objectId: ID;
		ignoreDragging?: boolean;
		content: Snippet<[ChildContext]>;
	}

	let { objectId, ignoreDragging = false, content }: Props = $props();

	const ui = useUI();

	let isSelected = $derived(ui.selectedIds.has(objectId));

	interface DraggingContext {
		gesture: ObjectTransformGesture;
		previousPointer: Vector;
		hasMovedAtAll: boolean;
	}

	let activeDragging: DraggingContext | undefined;

	function onPointerDown(ev: PointerEvent) {
		if (ignoreDragging || !(ui.editingScope instanceof UIGeneralEditingScope)) return;

		ev.preventDefault();

		if (!isSelected) {
			ui.commands.select([objectId], { deselectOthers: !ev.shiftKey });
		}

		activeDragging = {
			gesture: ui.commands.startMovingSelection(),
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
			activeDragging.gesture.submit();
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
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

{@render content({
	draggableEvents: createDraggableAttachment()
})}
