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

	let { anchor, alignH, alignV, fixedWidth } = $derived(layout);

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
					// When flicking through the available alignments, switching to a
					// justified flow and then BACK to non-justified, the editor shouldn't
					// do "invisible" changes.
					//
					// This does bear the potential to remove a user-configured fixed width,
					// but IMO the "flicking through alignments" case is much more likely:
					// The threshold for removing an existing fixed width is 0.01 PIXELS, it
					// seems extremely rare for a user to accidentally resize the text box to be
					// exactly what it would be if free-flowing.
					container!.style.width = 'max-content';
					const maxWidth = getRenderedSize().width;

					container!.style.removeProperty('width');

					const delta = Math.abs(maxWidth - fixedWidth!);
					if (delta < 0.01) {
						// The explicitly set fixed width is SIMILAR to what the text
						// measures at when free-flowing. In this case, prefer resetting
						// to an unconstrained width.
						fixedWidth = undefined;
					}
				}

				layout = {
					anchor: {
						x: anchor.x - (newCenterOffset - currentCenterOffset) * getRenderedSize().width,
						y: anchor.y
					},
					alignH: alignment,
					alignV: alignV,
					fixedWidth: fixedWidth
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
