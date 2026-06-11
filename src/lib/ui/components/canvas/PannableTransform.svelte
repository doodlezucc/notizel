<script lang="ts" module>
	import type { Vector } from '$lib/data/common';

	export interface TransformedPointerEvent {
		pointerInClientSpace: Vector;
		pointerInCanvasSpace: Vector;
	}
</script>

<script lang="ts">
	import { Vectors, type CameraTransform } from '$lib/data/common';
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	interface ChildContext {
		containerEvents: Attachment<HTMLElement>;
		backgroundEvents: Attachment<HTMLElement>;
	}

	interface Props {
		transform: CameraTransform;
		onBackgroundPrimaryPointerDownRaw?: (ev: PointerEvent) => void;
		onBackgroundTap?: (ev: TransformedPointerEvent) => void;
		onBackgroundDoubleTap?: (ev: TransformedPointerEvent) => void;
		content: Snippet<[ChildContext]>;
	}

	let { transform = $bindable(), content, ...events }: Props = $props();

	let containerRect: DOMRect | undefined;

	interface GestureContext {
		isPanGesture: boolean;
		previousPointer: Vector;
		isClickEvent: boolean;
	}

	let activeGesture: GestureContext | undefined;

	/** Returns the offset from the center of the container to the pointer in pixels. */
	function getPointerOffsetInClientSpace(pointerInClientSpace: Vector): Vector {
		return containerRect
			? Vectors.subtract(pointerInClientSpace, {
					x: containerRect.left + containerRect.width / 2,
					y: containerRect.top + containerRect.height / 2
				})
			: { x: 0, y: 0 };
	}

	function createTransformedPointerEvent(pointerInClientSpace: Vector): TransformedPointerEvent {
		return {
			pointerInClientSpace,
			get pointerInCanvasSpace() {
				return Vectors.subtract(
					Vectors.scale(getPointerOffsetInClientSpace(pointerInClientSpace), 1 / transform.scale),
					transform.position
				);
			}
		};
	}

	function onPointerDown(ev: PointerEvent) {
		if (ev.defaultPrevented) return;

		if (ev.button !== 0) {
			ev.preventDefault();
			if (activeGesture) return;

			activeGesture = {
				isPanGesture: true,
				previousPointer: { x: ev.clientX, y: ev.clientY },
				isClickEvent: true
			};
		}
	}

	function onBackgroundPointerDown(ev: PointerEvent) {
		ev.preventDefault();
		if (activeGesture) return;

		if (ev.button === 0) {
			events.onBackgroundPrimaryPointerDownRaw?.(ev);
		}

		activeGesture = {
			isPanGesture: ev.button !== 0,
			previousPointer: { x: ev.clientX, y: ev.clientY },
			isClickEvent: true
		};
	}

	function onPointerMove(ev: PointerEvent) {
		if (!activeGesture) return;

		// Maybe a threshold is needed here on mobile
		activeGesture.isClickEvent = false;

		if (activeGesture.isPanGesture) {
			const pointer: Vector = { x: ev.clientX, y: ev.clientY };

			const pointerDelta = Vectors.subtract(pointer, activeGesture.previousPointer);
			const delta = Vectors.scale(pointerDelta, 1 / transform.scale);

			transform.position = Vectors.add(transform.position, delta);

			activeGesture.previousPointer = pointer;
		}
	}

	function onPointerUp() {
		if (!activeGesture) return;

		if (!activeGesture.isPanGesture && activeGesture.isClickEvent) {
			events.onBackgroundTap?.(createTransformedPointerEvent(activeGesture.previousPointer));
		}

		activeGesture = undefined;
	}

	function onDoubleClick(ev: MouseEvent) {
		ev.preventDefault();
		events.onBackgroundDoubleTap?.(createTransformedPointerEvent({ x: ev.clientX, y: ev.clientY }));
	}

	function onWheel(ev: WheelEvent) {
		ev.preventDefault();

		const pivotOffsetInClientSpace = getPointerOffsetInClientSpace({
			x: ev.clientX,
			y: ev.clientY
		});

		const wheelMax = 50;
		const speed = 0.5;

		const amountUnsigned = Math.min(Math.abs(ev.deltaY), wheelMax) / wheelMax;
		const amountSigned = Math.sign(ev.deltaY) * amountUnsigned;

		const currentZoom = Math.log(transform.scale);
		const newZoom = currentZoom - amountSigned * speed;
		const newScale = Math.exp(newZoom);

		// The pivot has to keep the same screen offset to the center as before scaling
		const pivotOffsetBetweenScaling = Vectors.scale(
			pivotOffsetInClientSpace,
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

			element.addEventListener('pointerdown', onPointerDown);
			element.addEventListener('wheel', onWheel);
			resizeObserver.observe(element);

			return () => {
				element.removeEventListener('pointerdown', onPointerDown);
				element.removeEventListener('wheel', onWheel);
				resizeObserver.unobserve(element);
			};
		};
	}

	function createBackgroundAttachment(): Attachment<HTMLElement> {
		return (element) => {
			element.addEventListener('pointerdown', onBackgroundPointerDown);
			element.addEventListener('dblclick', onDoubleClick);

			return () => {
				element.removeEventListener('pointerdown', onBackgroundPointerDown);
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
