<script lang="ts">
	import { extractLayout } from '$lib/data/text-box-layout';
	import { MountedTextArea } from '$lib/ui/state/dom-bridge/text-area';
	import type { LiveTextCanvasObject } from '$lib/ui/state/live-objects';
	import { UITextAreaEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import UICanvasDraggableObject from '../canvas/UICanvasDraggableObject.svelte';
	import TextAreaObject, { type TextAreaObjectController } from './TextAreaObject.svelte';

	interface Props {
		object: LiveTextCanvasObject;
	}

	let { object }: Props = $props();

	const ui = useUI();

	let textArea = $state() as TextAreaObject;
	let isEditing = $derived(
		ui.editingScope instanceof UITextAreaEditingScope && ui.editingScope.objectId === object.id
	);

	let isSelected = $derived(isEditing || ui.selectedIds.has(object.id));

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
			ui.commands.textObjects.enterEditing(object.id);
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

	const mountedObject = new MountedTextArea({
		get container() {
			return textArea!.getContainer()!;
		},
		get layout() {
			return extractLayout(object);
		},
		get uiScale() {
			return ui.camera.scale;
		}
	});

	const controller: TextAreaObjectController = {
		setHorizontalAlignment: (alignment) => {
			const newLayout = mountedObject.computeHorizontalAlignmentChange(alignment);
			ui.commands.textObjects.setTextLayout(object.id, newLayout);
		},
		setVerticalAlignment: (alignment) => {
			const newLayout = mountedObject.computeVerticalAlignmentChange(alignment);
			ui.commands.textObjects.setTextLayout(object.id, newLayout);
		}
	};
</script>

<UICanvasDraggableObject objectId={object.id} ignoreDragging={isEditing} {mountedObject}>
	{#snippet content({ isInAreaSelection, draggableEvents })}
		<TextAreaObject
			bind:this={textArea}
			editor={object.editor}
			isSelected={isSelected || isInAreaSelection}
			{isEditing}
			layout={extractLayout(object)}
			{controller}
			{@attach draggableEvents}
			{@attach createAttachment()}
		/>
	{/snippet}
</UICanvasDraggableObject>
