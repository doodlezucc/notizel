<script lang="ts" module>
	export interface TextAreaObjectController {
		setHorizontalAlignment(alignment: FixedWidthTextAlignment): void;
		setVerticalAlignment(alignment: VerticalAlignment): void;
	}
</script>

<script lang="ts">
	import type { FixedWidthTextAlignment, Size, Vector, VerticalAlignment } from '$lib/data/common';
	import type { TextBoxAlignment } from '$lib/data/vault';
	import type { Editor as TiptapEditor } from '@tiptap/core';
	import ObjectAnchor, {
		getHorizontalCenterOffsetFraction,
		getVerticalCenterOffsetFraction
	} from './ObjectAnchor.svelte';
	import TiptapArea from './TiptapArea.svelte';
	import TextAreaToolbarWrapper from './toolbar/TextAreaToolbarWrapper.svelte';

	type TextAreaLayout = TextBoxAlignment & {
		anchor: Vector;
	};

	interface Props {
		editor: TiptapEditor;
		layout: TextAreaLayout;
		isSelected: boolean;
		isEditing: boolean;
		computeSize?: (clientRect: DOMRect) => Size;
	}

	let {
		editor,
		layout = $bindable(),
		isSelected,
		isEditing,
		computeSize,
		...attachments
	}: Props = $props();

	const { anchor, alignH, alignV, fixedWidth } = $derived(layout);

	let tiptapArea = $state<TiptapArea>();
	let container = $state<HTMLElement>();

	export function getTiptapArea() {
		return tiptapArea;
	}

	function getRenderedSize(): Size {
		if (!container) throw new Error('Container is not mounted');

		const clientRect = container.getBoundingClientRect();

		if (computeSize) {
			return computeSize(clientRect);
		} else {
			return clientRect;
		}
	}

	const controller: TextAreaObjectController = {
		setHorizontalAlignment(alignment: FixedWidthTextAlignment) {
			const currentCenterOffset = getHorizontalCenterOffsetFraction(alignH);
			const newCenterOffset = getHorizontalCenterOffsetFraction(alignment);

			const previousAlignment = alignH;

			if (alignment === 'justify') {
				// Justified text requires a fixed width
				const fixedWidth = layout.fixedWidth ?? getRenderedSize().width;

				layout = {
					anchor: {
						x: anchor.x - (newCenterOffset - currentCenterOffset) * fixedWidth,
						y: anchor.y
					},
					alignH: alignment,
					alignV: alignV,
					fixedWidth: fixedWidth
				};
			} else {
				if (previousAlignment === 'justify') {
					// TODO: Remove fixed width if it's within a small threshold of the actual width
				}
				layout = {
					anchor: {
						x: anchor.x - (newCenterOffset - currentCenterOffset) * getRenderedSize().width,
						y: anchor.y
					},
					alignH: alignment,
					alignV: alignV,
					fixedWidth: layout.fixedWidth
				};
			}
		},

		setVerticalAlignment(alignment: VerticalAlignment) {
			const currentCenterOffset = getVerticalCenterOffsetFraction(alignV);
			const newCenterOffset = getVerticalCenterOffsetFraction(alignment);

			layout = {
				...layout,
				anchor: {
					x: anchor.x,
					y: anchor.y - (newCenterOffset - currentCenterOffset) * getRenderedSize().height
				},
				alignV: alignment
			};
		}
	};
</script>

<ObjectAnchor {anchor} {alignH} {alignV}>
	<TextAreaToolbarWrapper alignment={layout} {controller}>
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
