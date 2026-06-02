<script lang="ts">
	import type { LiveTextCanvasObject } from '$lib/ui/state/live-objects';
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import UICanvasDraggableObject from '../canvas/UICanvasDraggableObject.svelte';
	import TextAreaObject from './TextAreaObject.svelte';

	interface Props {
		object: LiveTextCanvasObject;
	}

	let { object = $bindable() }: Props = $props();

	const ui = useUI();

	let textArea = $state() as TextAreaObject;
	let isEditing = $derived(
		ui.editingScope?.type === 'text' && ui.editingScope.objectId === object.id
	);

	let isSelected = $derived(ui.selection.selectedIds.has(object.id));

	$effect(() => {
		if (isEditing && !isSelected) {
			ui.stopEditing();
		}
	});

	$effect(() => {
		if (isEditing) {
			untrack(() => {
				textArea.getTiptapArea()?.focus();
			});
		}
	});

	function onDoubleClick(ev: MouseEvent) {
		ev.preventDefault();

		if (!isEditing) {
			ui.startEditing({
				type: 'text',
				objectId: object.id,
				wasJustCreated: false,
				originalContent: $state.snapshot(object.editor.getJSON())
			});
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
			editor={object.editor}
			{isSelected}
			{isEditing}
			computeSize={(rect) => ({
				width: rect.width / ui.camera.scale,
				height: rect.height / ui.camera.scale
			})}
			bind:anchor={object.anchor}
			bind:alignH={object.alignH}
			bind:alignV={object.alignV}
			bind:fixedWidth={object.fixedWidth}
			{@attach draggableEvents}
			{@attach createAttachment()}
		/>
	{/snippet}
</UICanvasDraggableObject>
