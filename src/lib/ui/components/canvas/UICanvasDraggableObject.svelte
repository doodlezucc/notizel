<script lang="ts">
	import { Vectors, type ID, type Vector } from '$lib/data/common';
	import { useUI } from '$lib/ui/state/UIContext.svelte';
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

	let isSelected = $derived(ui.selection.selectedIds.has(objectId));

	interface DraggingContext {
		previousPointer: Vector;
	}

	let activeDragging: DraggingContext | undefined;

	function onPointerDown(ev: PointerEvent) {
		if (ignoreDragging) return;

		ev.preventDefault();

		activeDragging = {
			previousPointer: { x: ev.screenX, y: ev.screenY }
		};

		if (!isSelected) {
			ui.selection.select(objectId, { deselectOthers: !ev.shiftKey });
		}
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeDragging) return;

		const pointer: Vector = { x: ev.screenX, y: ev.screenY };

		const pointerDelta = Vectors.subtract(pointer, activeDragging.previousPointer);
		const offset = Vectors.scale(pointerDelta, 1 / ui.canvas.camera.scale);

		ui.moveSelectionByOffset(offset);
		activeDragging.previousPointer = pointer;
	}

	function onPointerUp() {
		if (!activeDragging) return;

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
