<script lang="ts">
	import { type CameraTransform } from '$lib/data/common';
	import { RasterDoodlingEngine, Stroke } from '$lib/packages/doodling';
	import { onDestroy, untrack } from 'svelte';

	interface Props {
		transform: CameraTransform;
	}

	let { transform }: Props = $props();

	let canvas = $state<HTMLCanvasElement>();
	let width = $state(0);
	let height = $state(0);

	let engine = $state<RasterDoodlingEngine>();

	$effect(() => {
		if (!engine && canvas && width && height) {
			const gl = canvas.getContext('webgl2')!;
			engine = new RasterDoodlingEngine(gl, transform, { width, height });
		}
	});

	$effect(() => {
		if (engine && width && height) {
			untrack(() => {
				engine!.render(transform, { width, height });
			});
		}
	});

	onDestroy(() => {
		engine?.dispose();
	});

	interface BrushGesture {
		stroke: Stroke;
	}

	let gesture: BrushGesture | undefined;

	const radius = 20;

	function onPointerDown(ev: PointerEvent) {
		if (!engine || ev.button !== 0) return;

		ev.preventDefault();

		const stroke = engine.startStroke(
			{
				pointer: { x: ev.pageX, y: ev.pageY },
				pressure: ev.pressure
			},
			radius
		);

		gesture = { stroke: stroke };
	}

	function onPointerMove(ev: PointerEvent) {
		if (!gesture || !engine) return;

		gesture.stroke.emit({
			pointer: { x: ev.pageX, y: ev.pageY },
			pressure: ev.pressure
		});
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

		pointer-events: none;
	}
</style>
