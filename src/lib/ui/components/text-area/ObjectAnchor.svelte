<script lang="ts" module>
	import type {
		FixedWidthTextAlignment,
		LogicalAlignment,
		VerticalAlignment
	} from '$lib/data/common';

	const horizontalJustifyItemsValue: Record<FixedWidthTextAlignment, LogicalAlignment> = {
		start: 'start',
		center: 'center',
		end: 'end',
		justify: 'start'
	};

	const horizontalAlignmentCenterOffset: Record<FixedWidthTextAlignment, number> = {
		start: 0.5,
		center: 0,
		end: -0.5,
		justify: 0.5
	};

	const verticalAlignItemsValue: Record<VerticalAlignment, LogicalAlignment> = {
		top: 'start',
		center: 'center',
		bottom: 'end'
	};
	const verticalAlignmentCenterOffset: Record<VerticalAlignment, number> = {
		top: 0.5,
		center: 0,
		bottom: -0.5
	};

	export function getHorizontalCenterOffsetFraction(alignment: FixedWidthTextAlignment) {
		return horizontalAlignmentCenterOffset[alignment];
	}

	export function getVerticalCenterOffsetFraction(alignment: VerticalAlignment) {
		return verticalAlignmentCenterOffset[alignment];
	}
</script>

<script lang="ts">
	import type { TextCanvasObject } from '$lib/data/vault';
	import type { Snippet } from 'svelte';

	type Props = Pick<TextCanvasObject, 'alignH' | 'alignV' | 'anchor'> & {
		children: Snippet;
	};

	let { anchor, alignH, alignV, children }: Props = $props();
</script>

<div
	class="anchor"
	style:--x={anchor.x}
	style:--y={anchor.y}
	style:justify-items={horizontalJustifyItemsValue[alignH]}
	style:align-items={verticalAlignItemsValue[alignV]}
>
	{@render children()}
</div>

<style lang="scss">
	.anchor {
		position: absolute;
		transform: translate(calc(var(--x) * 1px), calc(var(--y) * 1px));

		outline: 4px solid red;
		display: grid;
	}
</style>
