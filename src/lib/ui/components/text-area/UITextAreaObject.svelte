<script lang="ts">
	import type { TextCanvasObject } from '$lib/data/vault';
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import UICanvasDraggableObject from '../canvas/UICanvasDraggableObject.svelte';
	import TextAreaObject from './TextAreaObject.svelte';

	interface Props {
		object: TextCanvasObject;
	}

	let { object = $bindable() }: Props = $props();

	const ui = useUI();

	let textArea = $state() as TextAreaObject;
	let isEditing = $state(false);

	let isSelected = $derived(ui.selection.selectedIds.has(object.id));

	$effect(() => {
		if (isEditing && !isSelected) {
			isEditing = false;
		}
	});

	function onDoubleClick(ev: MouseEvent) {
		ev.preventDefault();

		if (isEditing) return;

		const isAlreadySelected = ui.selection.selectedIds.has(object.id);

		if (isAlreadySelected) {
			isEditing = true;
			tick().then(() => textArea.getTiptapArea()!.focus());
		}
	}

	function createAttachment(): Attachment<HTMLElement> {
		return (element) => {
			element.addEventListener('dblclick', onDoubleClick);

			return () => {
				element.removeEventListener('dblclick', onDoubleClick);
			};
		};
	}
</script>

<UICanvasDraggableObject objectId={object.id} ignoreDragging={isEditing}>
	{#snippet content({ draggableEvents })}
		<TextAreaObject
			bind:this={textArea}
			{isSelected}
			{isEditing}
			computeSize={(rect) => ({
				width: rect.width / ui.canvas.camera.scale,
				height: rect.height / ui.canvas.camera.scale
			})}
			bind:content={object.content}
			bind:anchor={object.anchor}
			bind:alignH={object.alignH}
			bind:alignV={object.alignV}
			bind:fixedWidth={object.fixedWidth}
			{@attach draggableEvents}
			{@attach createAttachment()}
		/>
	{/snippet}
</UICanvasDraggableObject>
