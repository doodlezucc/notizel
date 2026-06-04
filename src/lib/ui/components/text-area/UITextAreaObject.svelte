<script lang="ts">
	import type { LiveTextCanvasObject } from '$lib/ui/state/live-objects';
	import { UITextAreaEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
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
			ui.commands.enterTextAreaEditingScope(object.id);
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
			// TODO: In the future, the TextAreaObject shouldn't have agency over these
			// properties, as they will be controlled from a different place in the UI.
			bind:anchor={object.anchor}
			bind:alignH={object.alignH}
			bind:alignV={object.alignV}
			bind:fixedWidth={object.fixedWidth}
			{@attach draggableEvents}
			{@attach createAttachment()}
		/>
	{/snippet}
</UICanvasDraggableObject>
