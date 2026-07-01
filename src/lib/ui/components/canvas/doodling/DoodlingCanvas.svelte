<script lang="ts">
	import { Vectors, type CameraTransform, type Vector } from '$lib/data/common';
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

	interface BrushGesture {
		previousPointer: Vector;
		previousPressure: number;
	}

	let gesture: BrushGesture | undefined;

	const radius = 20;

	function onPointerDown(ev: PointerEvent) {
		ev.preventDefault();

		const pointer = { x: ev.pageX, y: ev.pageY };
		engine?.paint(pointer, radius * ev.pressure);

		gesture = { previousPointer: pointer, previousPressure: ev.pressure };
		needsRepaint = true;
	}

	function onPointerMove(ev: PointerEvent) {
		if (!gesture || !engine) return;

		const { previousPointer, previousPressure } = gesture;

		const pointer = { x: ev.pageX, y: ev.pageY };
		const pressure = ev.pressure;

		const smallestRadius = Math.max(1, radius * Math.min(previousPressure, pressure));

		const distance = Vectors.distance(pointer, previousPointer);

		const maxDistanceBetweenStamps = Math.min(2, smallestRadius);

		const steps = Math.floor(distance / maxDistanceBetweenStamps);

		for (let i = 1; i < steps; i++) {
			const t = i / steps;
			const v = Vectors.interpolate(previousPointer, pointer, t);
			const p = previousPressure + t * (pressure - previousPressure);
			engine.paint(v, radius * p);
		}

		engine.paint(pointer, radius * pressure);
		needsRepaint = true;

		gesture.previousPointer = pointer;
		gesture.previousPressure = pressure;
	}

	function onPointerUp() {
		gesture = undefined;
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
