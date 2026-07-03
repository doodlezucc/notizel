import type { Vector } from '$lib/data/common';

export interface StrokeEvent {
	pointer: Vector;
	pressure: number;
}

export abstract class Stroke {
	private previousEvent?: StrokeEvent;

	emit(event: StrokeEvent) {
		if (!this.previousEvent) {
			this.drawInitialEvent(event);
		} else {
			this.drawSegment(this.previousEvent, event);
		}

		this.previousEvent = event;
	}

	abstract complete(): void;

	protected abstract drawInitialEvent(event: StrokeEvent): void;
	protected abstract drawSegment(from: StrokeEvent, to: StrokeEvent): void;
}
