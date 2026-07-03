export class RedrawMarker {
	protected needsRedraw = false;

	markNeedsRedraw() {
		this.needsRedraw = true;
	}
}

export class AnimationRedrawMarker extends RedrawMarker {
	private readonly redraw: () => void;
	private scheduledAnimationFrame: number;

	constructor(redraw: () => void) {
		super();
		this.redraw = redraw;

		const tick = () => {
			this.scheduledAnimationFrame = requestAnimationFrame(tick);
			this.redrawIfNeeded();
		};

		this.scheduledAnimationFrame = requestAnimationFrame(tick);
	}

	dispose() {
		cancelAnimationFrame(this.scheduledAnimationFrame);
	}

	private redrawIfNeeded() {
		if (this.needsRedraw) {
			this.redraw();
			this.needsRedraw = false;
		}
	}
}
