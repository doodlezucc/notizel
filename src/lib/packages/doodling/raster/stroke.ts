import type { Size, Vector } from '$lib/data/common';
import { GLDrawableTexture } from '../webgl/misc/drawable-texture';
import { glBindResources, GLResource, type GL, type UnbindFunction } from '../webgl/resource';
import type { Brush } from './brush';
import { LinearStrokeSegment, type StrokePoint } from './stroke-segment';

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

class StrokeImpl extends Stroke {
	private readonly layer: TemporaryStrokeLayer;
	private readonly brush: Brush;
	private readonly radius: number;

	constructor(layer: TemporaryStrokeLayer, brush: Brush, radius: number) {
		super();
		this.layer = layer;
		this.brush = brush;
		this.radius = radius;
	}

	private transformEventToPoint(event: StrokeEvent): StrokePoint {
		return {
			position: event.pointer,
			radius: event.pressure * this.radius
		};
	}

	protected drawInitialEvent(event: StrokeEvent): void {
		const point = this.transformEventToPoint(event);

		glBindResources([this.layer.bindFramebuffer()], () => {
			this.brush.drawInitialPoint(point);
		});
	}

	protected drawSegment(from: StrokeEvent, to: StrokeEvent): void {
		const segment = new LinearStrokeSegment(
			this.transformEventToPoint(from),
			this.transformEventToPoint(to)
		);

		glBindResources([this.layer.bindFramebuffer()], () => {
			this.brush.drawSegment(segment);
		});
	}

	complete(): void {
		// TODO: Apply painted texture to dirty canvas tiles
	}
}

export class TemporaryStrokeLayer extends GLResource {
	private readonly drawableTexture: GLDrawableTexture;

	constructor(gl: GL, size: Size) {
		super(gl);
		this.drawableTexture = new GLDrawableTexture(gl, size);
	}

	get texture() {
		return this.drawableTexture.texture;
	}

	destroy() {
		this.drawableTexture.destroy();
	}

	bindFramebuffer(): UnbindFunction {
		return this.drawableTexture.bindFramebuffer();
	}

	createStroke(brush: Brush, radiusSetting: number): Stroke {
		return new StrokeImpl(this, brush, radiusSetting);
	}
}
