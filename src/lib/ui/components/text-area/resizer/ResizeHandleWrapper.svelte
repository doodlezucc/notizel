<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tether } from 'svelte-tether';
	import { forwardPannableTransformEvents } from '../../canvas/PannableTransform.svelte';
	import ResizeHandle from './ResizeHandle.svelte';

	export interface ResizeContext {
		side: 'left' | 'right';
		event: PointerEvent;
	}

	interface Props {
		disabled?: boolean;
		children: Snippet;
		onResizeStart: (context: ResizeContext) => void;
	}

	let { disabled = false, children, onResizeStart }: Props = $props();
</script>

<Tether {children} origin="top-center" direction="bottom-center" inheritWidth inheritHeight>
	{#snippet portal()}
		<div class="handles" {@attach forwardPannableTransformEvents}>
			{#if !disabled}
				<ResizeHandle onPointerDown={(event) => onResizeStart({ side: 'left', event })} />
				<ResizeHandle onPointerDown={(event) => onResizeStart({ side: 'right', event })} />
			{/if}
		</div>
	{/snippet}
</Tether>

<style lang="scss">
	.handles {
		display: contents;
		pointer-events: none;
	}

	.handles > :global(*) {
		pointer-events: all;
		position: absolute;
		top: 0;
		bottom: 0;

		&:first-child {
			left: 0;
		}

		&:last-child {
			left: 100%;
		}
	}
</style>
