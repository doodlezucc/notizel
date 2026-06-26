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

	const verticalAlignItemsValue: Record<VerticalAlignment, LogicalAlignment> = {
		top: 'start',
		center: 'center',
		bottom: 'end'
	};
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
		display: grid;
	}
</style>
