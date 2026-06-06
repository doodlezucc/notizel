import type { Size } from './size';
import { Vectors, type Vector } from './vector';

export abstract class BoundingBox {}

export const BoundingBoxes = {
	checkOverlapping: (a: BoundingBox, b: BoundingBox): boolean => {
		if (a instanceof AxisAlignedBoundingBox && b instanceof AxisAlignedBoundingBox) {
			const intersectionLeft = Math.max(a.topLeft.x, b.topLeft.x);
			const intersectionRight = Math.min(a.bottomRight.x, b.bottomRight.x);

			if (intersectionLeft > intersectionRight) return false;

			const intersectionTop = Math.max(a.topLeft.y, b.topLeft.y);
			const intersectionBottom = Math.min(a.bottomRight.y, b.bottomRight.y);

			if (intersectionTop > intersectionBottom) return false;

			return true;
		} else {
			throw new Error('BoundingBoxes.checkOverlapping not implemented for oriented bounding boxes');
		}
	}
};

export class OrientedBoundingBox extends BoundingBox {
	constructor(
		readonly center: Vector,
		readonly size: Size,
		readonly angle: number
	) {
		super();
	}
}

export class AxisAlignedBoundingBox extends BoundingBox {
	constructor(
		readonly topLeft: Vector,
		readonly size: Size
	) {
		super();
	}

	static fromTopLeft(topLeft: Vector, size: Size) {
		return new AxisAlignedBoundingBox(topLeft, size);
	}

	static fromCenter(center: Vector, size: Size) {
		return new AxisAlignedBoundingBox(
			{ x: center.x - size.width / 2, y: center.y - size.height / 2 },
			size
		);
	}

	static fromPoints(a: Vector, b: Vector) {
		const topLeft: Vector = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) };
		const bottomRight: Vector = { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) };
		return new AxisAlignedBoundingBox(topLeft, {
			width: bottomRight.x - topLeft.x,
			height: bottomRight.y - topLeft.y
		});
	}

	#center: Vector | undefined;
	get center() {
		return (this.#center ??= Vectors.add(this.topLeft, {
			x: this.size.width / 2,
			y: this.size.height / 2
		}));
	}

	#bottomRight: Vector | undefined;
	get bottomRight() {
		return (this.#bottomRight ??= Vectors.add(this.topLeft, {
			x: this.size.width,
			y: this.size.height
		}));
	}
}
