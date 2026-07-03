import type { GLGeometryShaderBinding } from '../webgl/geometry/geometry-shader-binding';
import type { GLQuad } from '../webgl/geometry/quad';
import { GLProgram, type GLProgramOf } from '../webgl/program/program';
import { GLResource, type GL } from '../webgl/resource';
import { shaderBrush } from './shaders/brush';
import type { StrokePoint, StrokeSegment } from './stroke-segment';

export interface Brush extends GLResource {
	drawInitialPoint(point: StrokePoint): void;
	drawSegment(segment: StrokeSegment): void;
}

export class StampBrush extends GLResource implements Brush {
	private readonly brushProgram: GLProgramOf<typeof shaderBrush>;
	private readonly clipSpaceQuadBrushVAO: GLGeometryShaderBinding;

	constructor(gl: GL, clipSpaceQuad: GLQuad) {
		super(gl);
		this.brushProgram = GLProgram.create(gl, shaderBrush);
		this.clipSpaceQuadBrushVAO = clipSpaceQuad.createShaderBinding({
			position: this.brushProgram.attributes.position,
			uv: this.brushProgram.attributes.uv
		});
	}

	destroy() {
		this.brushProgram.destroy();
		this.clipSpaceQuadBrushVAO.destroy();
	}

	drawInitialPoint(point: StrokePoint) {
		this.clipSpaceQuadBrushVAO.bindVertexArray();
		this.brushProgram.bindProgram({
			color: (loc) => this.gl.uniform4f(loc, 1.0, 0.5, 0.3, 1.0)
		});

		this.drawStamp(point);
	}

	drawSegment(segment: StrokeSegment) {
		const smallestRadius = Math.max(1, segment.minRadius);
		const maxAllowedDistanceBetweenStamps = Math.min(2, smallestRadius);

		const length = segment.length;
		const steps = Math.floor(length / maxAllowedDistanceBetweenStamps);

		const pointsToStamp: StrokePoint[] = [];

		for (let i = 1; i < steps; i++) {
			const distance = (segment.length * i) / steps;

			pointsToStamp.push(segment.interpolate(distance));
		}

		pointsToStamp.push(segment.to);

		this.clipSpaceQuadBrushVAO.bindVertexArray();
		this.brushProgram.bindProgram({
			color: (loc) => this.gl.uniform4f(loc, 1.0, 0.5, 0.3, 1.0)
		});

		for (const point of pointsToStamp) {
			this.drawStamp(point);
		}
	}

	private drawStamp(point: StrokePoint) {
		const { position, radius } = point;

		const minX = position.x - radius;
		const minY = position.y - radius;
		const diameter = radius * 2;

		const gl = this.gl;

		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(minX, minY, diameter, diameter);
		gl.viewport(minX, minY, diameter, diameter);

		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);
		gl.disable(gl.SCISSOR_TEST);
	}
}
