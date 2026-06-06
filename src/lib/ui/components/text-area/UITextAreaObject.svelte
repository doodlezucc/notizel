<script lang="ts">
	import { AxisAlignedBoundingBox, type Vector } from '$lib/data/common';
	import type { LiveTextCanvasObject } from '$lib/ui/state/live-objects';
	import type { MountedObject } from '$lib/ui/state/ui-dom-bridge';
	import { UITextAreaEditingScope } from '$lib/ui/state/ui-editing-scope.svelte';
	import { useUI } from '$lib/ui/state/UIContextWrapper.svelte';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import UICanvasDraggableObject from '../canvas/UICanvasDraggableObject.svelte';
	import TextAreaObject from './TextAreaObject.svelte';

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

	const mountedObject: MountedObject = {
		computeBoundsInClientSpace: () => {
			const clientRect = textArea.getAxisAlignedBoundingClientRect();

			const clientRectCenter: Vector = {
				x: clientRect.left + clientRect.width / 2,
				y: clientRect.top + clientRect.height / 2
			};

			return AxisAlignedBoundingBox.fromCenter(clientRectCenter, {
				width: clientRect.width,
				height: clientRect.height
			});
		}
	};
</script>

<UICanvasDraggableObject objectId={object.id} ignoreDragging={isEditing} {mountedObject}>
	{#snippet content({ draggableEvents })}
		<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
		{@const { editor, id, type, ...layout } = object}

		<TextAreaObject
			bind:this={textArea}
			editor={object.editor}
			{isSelected}
			{isEditing}
			computeSize={(rect) => ({
				width: rect.width / ui.camera.scale,
				height: rect.height / ui.camera.scale
			})}
			bind:layout={
				() => layout, (newLayout) => ui.commands.submitTextAreaLayout(object.id, newLayout)
			}
			{@attach draggableEvents}
			{@attach createAttachment()}
		/>
	{/snippet}
</UICanvasDraggableObject>
