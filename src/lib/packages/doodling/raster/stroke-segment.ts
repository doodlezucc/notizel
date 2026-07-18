import { AxisAlignedBoundingBox, Vectors, type Vector } from '$lib/data/common';

export interface StrokePoint {
	position: Vector;
	radius: number;
}

export abstract class StrokeSegment {
	readonly from: StrokePoint;
	readonly to: StrokePoint;

	constructor(from: StrokePoint, to: StrokePoint) {
		this.from = from;
		this.to = to;
	}

	/** Returns the total segment length. */
	abstract get length(): number;

	/** Returns the evaluated smallest radius along this segment. */
	abstract get minRadius(): number;

	/** Returns the evaluated largest radius along this segment. */
	abstract get maxRadius(): number;

	/**
	 * Evaluates the result of starting at `from` and walking `distance` toward `to`.
	 */
	abstract interpolate(distance: number): StrokePoint;

	abstract computeBoundingBox(): AxisAlignedBoundingBox;
}

export class LinearStrokeSegment extends StrokeSegment {
	#length?: number;

	override get length(): number {
		return (this.#length ??= Vectors.distance(this.from.position, this.to.position));
	}

	override get minRadius(): number {
		return Math.min(this.from.radius, this.to.radius);
	}

	override get maxRadius(): number {
		return Math.max(this.from.radius, this.to.radius);
	}

	override interpolate(distance: number): StrokePoint {
		const t = distance / this.length;

		return {
			position: Vectors.interpolate(this.from.position, this.to.position, t),
			radius: this.from.radius + t * (this.to.radius - this.from.radius)
		};
	}

	override computeBoundingBox(): AxisAlignedBoundingBox {
		return AxisAlignedBoundingBox.fromPoints(this.from.position, this.to.position).inflate(
			this.maxRadius
		);
	}
}
