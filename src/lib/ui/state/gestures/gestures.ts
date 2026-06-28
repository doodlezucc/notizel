import { StackUser } from '../stack/stack-user';

export interface GestureHandle<T extends Gesture = Gesture> {
	readonly state: Omit<T, 'complete' | 'cancel'>;

	complete(): void;
	cancel(): void;
}

export abstract class Gesture extends StackUser {
	#isOver = false;

	get isOver() {
		return this.#isOver;
	}

	complete() {
		if (!this.#isOver) {
			this.#isOver = true;
			this.onComplete();
		}
	}

	cancel() {
		if (!this.#isOver) {
			this.#isOver = true;
			this.onCancel();
		}
	}

	protected abstract onComplete(): void;
	protected abstract onCancel(): void;
}
