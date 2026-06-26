<script lang="ts" module>
	export interface TextAreaObjectController {
		setHorizontalAlignment(alignment: FixedWidthTextAlignment): void;
		setVerticalAlignment(alignment: VerticalAlignment): void;
	}
</script>

<script lang="ts">
	import type { FixedWidthTextAlignment, VerticalAlignment } from '$lib/data/common';
	import type { TextBoxLayout } from '$lib/data/text-box-layout';
	import type { Editor as TiptapEditor } from '@tiptap/core';
	import ObjectAnchor from './ObjectAnchor.svelte';
	import TiptapArea from './TiptapArea.svelte';
	import TextAreaToolbarWrapper from './toolbar/TextAreaToolbarWrapper.svelte';

	interface Props {
		editor: TiptapEditor;
		layout: TextBoxLayout;
		controller: TextAreaObjectController;
		isSelected: boolean;
		isEditing: boolean;
	}

	let { editor, controller, layout, isSelected, isEditing, ...attachments }: Props = $props();

	let { anchor, alignH, alignV, fixedWidth } = $derived(layout);

	let tiptapArea = $state<TiptapArea>();
	let container = $state<HTMLElement>();

	export function getTiptapArea() {
		return tiptapArea;
	}

	export function getContainer() {
		return container;
	}
</script>

<ObjectAnchor {anchor} {alignH} {alignV}>
	<TextAreaToolbarWrapper visible={isSelected || isEditing} alignment={layout} {controller}>
		<div
			class="text-area"
			bind:this={container}
			style:--w={fixedWidth !== undefined ? `${fixedWidth}px` : undefined}
			style:text-align={alignH}
			class:selected={isSelected}
			class:editing={isEditing}
			{...attachments}
		>
			<TiptapArea bind:this={tiptapArea} {editor} disableInteraction={!isEditing} />
		</div>
	</TextAreaToolbarWrapper>
</ObjectAnchor>

<style lang="scss">
	.text-area {
		position: absolute;
		width: var(--w, max-content);

		&:hover {
			outline: 1px solid #0003;
		}

		&.selected {
			outline: 1px solid currentColor;
		}

		&.editing {
			outline: 2px solid #55f;
		}
	}
</style>
