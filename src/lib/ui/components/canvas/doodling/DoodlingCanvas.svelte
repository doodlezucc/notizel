<script lang="ts">
	import type { CameraTransform } from '$lib/data/common';
	import { RasterDoodlingEngine } from '$lib/packages/doodling';
	import { onDestroy, onMount } from 'svelte';

	const transform: CameraTransform = { position: { x: 0, y: 0 }, scale: 1 };

	let canvas = $state<HTMLCanvasElement>();
	let width = $state(0);
	let height = $state(0);

	let engine = $state<RasterDoodlingEngine>();

	$effect(() => {
		if (!engine && canvas && width && height) {
			const gl = canvas.getContext('webgl2')!;
			engine = new RasterDoodlingEngine(gl, { width, height });
		}
	});

	$effect(() => {
		if (engine && width && height) {
			engine.render(transform, { width, height });
		}
	});

	onDestroy(() => {
		engine?.dispose();
	});

	let needsRepaint = false;
	let scheduledAnimationFrame!: number;

	function tick() {
		scheduledAnimationFrame = requestAnimationFrame(tick);

		if (needsRepaint) {
			needsRepaint = false;
			engine?.render(transform, { width, height });
		}
	}

	onMount(() => {
		scheduledAnimationFrame = requestAnimationFrame(tick);

		onDestroy(() => {
			cancelAnimationFrame(scheduledAnimationFrame);
		});
	});

	let isBrushDown = false;

	function onPointerDown(ev: PointerEvent) {
		ev.preventDefault();

		isBrushDown = true;
		engine?.paint({ x: ev.pageX, y: ev.pageY }, 40 * ev.pressure);
		needsRepaint = true;
	}

	function onPointerMove(ev: PointerEvent) {
		if (!isBrushDown) return;

		engine?.paint({ x: ev.pageX, y: ev.pageY }, 40 * ev.pressure);
		needsRepaint = true;
	}

	function onPointerUp() {
		isBrushDown = false;
	}
</script>

<svelte:window
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
/>

<div bind:clientWidth={width} bind:clientHeight={height}>
	{#if width > 0 && height > 0}
		<canvas bind:this={canvas} {width} {height}></canvas>
	{/if}
</div>

<style lang="scss">
	div {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;

		touch-action: none;
	}
</style>
