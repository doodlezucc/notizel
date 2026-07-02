import type { Vector } from '$lib/data/common';
import type { GL } from '../resource';
import { GLGeometry2D } from './geometry';

interface QuadDimensions {
	topLeft: Vector;
	bottomRight: Vector;
}

export class GLQuad extends GLGeometry2D {
	constructor(gl: GL, dimensions: QuadDimensions) {
		const { x: ax, y: ay } = dimensions.topLeft;
		const { x: bx, y: by } = dimensions.bottomRight;

		super(gl, [
			[ax, ay, 0, 1],
			[bx, ay, 1, 1],
			[ax, by, 0, 0],
			[bx, ay, 1, 1],
			[bx, by, 1, 0],
			[ax, by, 0, 0]
		]);
	}

	static fullClipSpace(gl: GL) {
		return new GLQuad(gl, {
			topLeft: { x: -1, y: -1 },
			bottomRight: { x: 1, y: 1 }
		});
	}
}
