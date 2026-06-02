<script lang="ts">
	import type { FixedWidthTextAlignment, Size, VerticalAlignment } from '$lib/data/common';
	import type { LiveTextCanvasObject } from '$lib/ui/state/live-objects';
	import ObjectAnchor, {
		getHorizontalCenterOffsetFraction,
		getVerticalCenterOffsetFraction
	} from './ObjectAnchor.svelte';
	import TiptapArea from './TiptapArea.svelte';

	type Props = Omit<LiveTextCanvasObject, 'id' | 'type'> & {
		isSelected: boolean;
		isEditing: boolean;
		computeSize?: (clientRect: DOMRect) => Size;
	};

	let {
		editor,
		anchor = $bindable(),
		alignH = $bindable(),
		alignV = $bindable(),
		fixedWidth = $bindable(),
		isSelected,
		isEditing,
		computeSize,
		...attachments
	}: Props = $props();

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

	function switchAlignH() {
		const options: FixedWidthTextAlignment[] = ['start', 'center', 'end', 'justify'];
		setHorizontalAlignment(options[Math.floor(Math.random() * options.length)]);
	}

	function switchAlignV() {
		if (alignV === 'top') {
			setVerticalAlignment('center');
		} else if (alignV === 'center') {
			setVerticalAlignment('bottom');
		} else if (alignV === 'bottom') {
			setVerticalAlignment('top');
		}
	}

	function setHorizontalAlignment(alignment: FixedWidthTextAlignment) {
		const currentCenterOffset = getHorizontalCenterOffsetFraction(alignH);
		const newCenterOffset = getHorizontalCenterOffsetFraction(alignment);

		anchor.x -= (newCenterOffset - currentCenterOffset) * getRenderedSize().width;
		alignH = alignment;
	}

	function setVerticalAlignment(alignment: VerticalAlignment) {
		const currentCenterOffset = getVerticalCenterOffsetFraction(alignV);
		const newCenterOffset = getVerticalCenterOffsetFraction(alignment);

		anchor.y -= (newCenterOffset - currentCenterOffset) * getRenderedSize().height;
		alignV = alignment;
	}
</script>

<ObjectAnchor {anchor} {alignH} {alignV}>
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

		<div class="tools">
			<button onclick={switchAlignH}>{alignH}</button>
			<button onclick={switchAlignV}>{alignV}</button>
		</div>
	</div>
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

	.tools {
		position: absolute;
	}
</style>
