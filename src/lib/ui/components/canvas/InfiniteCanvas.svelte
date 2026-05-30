<script lang="ts">
	import { type CameraTransform } from '$lib/data/common';
	import type { Snippet } from 'svelte';
	import PannableTransform, { type TransformedPointerEvent } from './PannableTransform.svelte';

	interface Props {
		transform: CameraTransform;
		onBackgroundTap?: (ev: TransformedPointerEvent) => void;
		onBackgroundDoubleTap?: (ev: TransformedPointerEvent) => void;
		background: Snippet<[{ transform: CameraTransform }]>;
		children: Snippet;
	}

	let {
		transform = $bindable(),
		onBackgroundTap,
		onBackgroundDoubleTap,
		background,
		children
	}: Props = $props();
</script>

<PannableTransform bind:transform {onBackgroundTap} {onBackgroundDoubleTap}>
	{#snippet content({ containerEvents, backgroundEvents })}
		<div class="canvas" {@attach containerEvents}>
			<div class="background" aria-label="Background" tabindex="-1" {@attach backgroundEvents}>
				{@render background({ transform })}
			</div>

			<div
				class="panned"
				style:--x="{transform.position.x}px"
				style:--y="{transform.position.y}px"
				style:--scale={transform.scale}
			>
				{@render children()}
			</div>
		</div>
	{/snippet}
</PannableTransform>

<style lang="scss">
	.canvas {
		overflow: hidden;
		position: relative;
		display: grid;
		place-items: center;
		flex: 1;
	}

	.background {
		position: absolute;
		outline: none;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: grid;
	}

	.panned {
		position: relative;

		transform: scale(var(--scale)) translate(var(--x), var(--y));
	}
</style>
