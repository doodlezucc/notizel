<script lang="ts">
	import { Vectors, type CameraTransform, type Vector } from '$lib/data/common';
	import type { Snippet } from 'svelte';
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

	interface GestureContext {
		previousPointer: Vector;
		isClickEvent: boolean;
	}

	let activeGesture: GestureContext | undefined;

	function onPointerDown(ev: PointerEvent) {
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

	function onPointerUp(ev: PointerEvent) {
		if (!activeGesture) return;

		if (activeGesture.isClickEvent) {
			onClick?.();
		}

		activeGesture = undefined;
	}

	function onDoubleClick(ev: MouseEvent) {
		console.log('dbl', ev);
	}

	function onWheel(ev: WheelEvent) {
		const wheelMax = 50;
		const speed = 0.5;

		const amountUnsigned = Math.min(Math.abs(ev.deltaY), wheelMax) / wheelMax;
		const amountSigned = Math.sign(ev.deltaY) * amountUnsigned;

		const currentZoom = Math.log(transform.scale);
		const newZoom = currentZoom - amountSigned * speed;

		transform.scale = Math.exp(newZoom);
	}

	function createContainerAttachment(): Attachment<HTMLElement> {
		return (element) => {
			element.addEventListener('wheel', onWheel);

			return () => {
				element.removeEventListener('wheel', onWheel);
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
