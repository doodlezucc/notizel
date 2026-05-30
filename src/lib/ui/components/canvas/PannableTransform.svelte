<script lang="ts">
	import { Vectors, type CameraTransform, type Vector } from '$lib/data/common';
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	interface ChildContext {
		containerEvents: Attachment<HTMLElement>;
		backgroundEvents: Attachment<HTMLElement>;
	}

	interface Props {
		transform: CameraTransform;
		onClick?: () => void;
		content: Snippet<[ChildContext]>;
	}

	let { transform = $bindable(), onClick, content }: Props = $props();

	let containerRect: DOMRect | undefined;

	interface GestureContext {
		previousPointer: Vector;
		isClickEvent: boolean;
	}

	let activeGesture: GestureContext | undefined;

	function onPointerDown(ev: PointerEvent) {
		ev.preventDefault();

		activeGesture = {
			previousPointer: { x: ev.screenX, y: ev.screenY },
			isClickEvent: true
		};
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeGesture) return;

		// Maybe a threshold is needed here on mobile
		activeGesture.isClickEvent = false;

		const pointer: Vector = { x: ev.screenX, y: ev.screenY };

		const pointerDelta = Vectors.subtract(pointer, activeGesture.previousPointer);
		const delta = Vectors.scale(pointerDelta, 1 / transform.scale);

		transform.position = Vectors.add(transform.position, delta);

		activeGesture.previousPointer = pointer;
	}

	function onPointerUp() {
		if (!activeGesture) return;

		if (activeGesture.isClickEvent) {
			onClick?.();
		}

		activeGesture = undefined;
	}

	function onDoubleClick(ev: MouseEvent) {
		ev.preventDefault();
		console.log('dbl', ev);
	}

	function onWheel(ev: WheelEvent) {
		// Offset from the center of the element to the mouse position in pixels
		const pivotInClientSpace: Vector = containerRect
			? {
					x: ev.clientX - containerRect.left - containerRect.width / 2,
					y: ev.clientY - containerRect.top - containerRect.height / 2
				}
			: { x: 0, y: 0 };

		const wheelMax = 50;
		const speed = 0.5;

		const amountUnsigned = Math.min(Math.abs(ev.deltaY), wheelMax) / wheelMax;
		const amountSigned = Math.sign(ev.deltaY) * amountUnsigned;

		const currentZoom = Math.log(transform.scale);
		const newZoom = currentZoom - amountSigned * speed;
		const newScale = Math.exp(newZoom);

		// The pivot has to keep the same screen offset to the center as before scaling
		const pivotOffsetBetweenScaling = Vectors.scale(
			pivotInClientSpace,
			1 / newScale - 1 / transform.scale
		);
		const newPosition = Vectors.add(transform.position, pivotOffsetBetweenScaling);

		transform = {
			position: newPosition,
			scale: newScale
		};
	}

	let resizeObserver!: ResizeObserver;

	function createResizeObserver() {
		return new ResizeObserver((entries) => {
			const containerEntry = entries.at(-1);
			if (!containerEntry) return;

			containerRect = containerEntry.target.getBoundingClientRect();
		});
	}

	function createContainerAttachment(): Attachment<HTMLElement> {
		return (element) => {
			// Lazy initialization after mount to allow some server-side rendering
			resizeObserver ??= createResizeObserver();

			element.addEventListener('wheel', onWheel);
			resizeObserver.observe(element);

			return () => {
				element.removeEventListener('wheel', onWheel);
				resizeObserver.unobserve(element);
			};
		};
	}

	function createBackgroundAttachment(): Attachment<HTMLElement> {
		return (element) => {
			element.addEventListener('pointerdown', onPointerDown);
			element.addEventListener('dblclick', onDoubleClick);

			return () => {
				element.removeEventListener('pointerdown', onPointerDown);
				element.removeEventListener('dblclick', onDoubleClick);
			};
		};
	}
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

{@render content({
	containerEvents: createContainerAttachment(),
	backgroundEvents: createBackgroundAttachment()
})}
