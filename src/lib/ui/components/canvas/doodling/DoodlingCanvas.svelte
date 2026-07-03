<script lang="ts">
	import { type CameraTransform } from '$lib/data/common';
	import { RasterDoodlingEngine, Stroke } from '$lib/packages/doodling';
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

	interface BrushGesture {
		stroke: Stroke;
	}

	let gesture: BrushGesture | undefined;

	const radius = 20;

	function onPointerDown(ev: PointerEvent) {
		if (!engine) return;

		ev.preventDefault();

		const stroke = engine.startStroke(
			{
				pointer: { x: ev.pageX, y: ev.pageY },
				pressure: ev.pressure
			},
			radius
		);

		gesture = { stroke: stroke };
		needsRepaint = true;
	}

	function onPointerMove(ev: PointerEvent) {
		if (!gesture || !engine) return;

		gesture.stroke.emit({
			pointer: { x: ev.pageX, y: ev.pageY },
			pressure: ev.pressure
		});

		needsRepaint = true;
	}

	function onPointerUp() {
		if (gesture) {
			gesture.stroke.complete();
			gesture = undefined;
		}
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
