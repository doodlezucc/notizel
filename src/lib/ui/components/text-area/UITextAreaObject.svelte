<script lang="ts">
	import type { TextCanvasObject } from '$lib/data/vault';
	import { useUI } from '$lib/ui/state/UIContext.svelte';
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
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

	function onClick(ev: MouseEvent) {
		ev.preventDefault();

		if (isEditing) return;

		const isAlreadySelected = ui.selection.selectedIds.has(object.id);

		if (isAlreadySelected) {
			isEditing = true;
			tick().then(() => textArea.getTiptapArea()!.focus());
		} else {
			ui.selection.select(object.id, { deselectOthers: !ev.shiftKey });
		}
	}

	function createAttachment(): Attachment<HTMLElement> {
		return (element) => {
			element.addEventListener('click', onClick);

			return () => {
				element.removeEventListener('click', onClick);
			};
		};
	}
</script>

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
	{@attach createAttachment()}
/>
