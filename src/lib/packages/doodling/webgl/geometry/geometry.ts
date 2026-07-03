import { GLResource, type GL } from '../resource';
import { GLGeometryShaderBinding } from './geometry-shader-binding';

type InlineUVVertex = [x: number, y: number, u: number, v: number];

interface UVVertexLocations {
	position: GLint;
	uv: GLint;
}

export abstract class GLGeometry2D extends GLResource {
	private readonly buffer: WebGLBuffer;

	constructor(gl: GL, vertices: InlineUVVertex[]) {
		super(gl);

		const vertexArray = new Float32Array(vertices.flat());

		this.buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
	}

	createShaderBinding(locations: UVVertexLocations) {
		const gl = this.gl;

		return new GLGeometryShaderBinding(gl, () => {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

			const loc = locations;

			const positionSize = 2 * Float32Array.BYTES_PER_ELEMENT;
			const uvSize = 2 * Float32Array.BYTES_PER_ELEMENT;
			const stride = positionSize + uvSize;

			gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, stride, 0);
			gl.enableVertexAttribArray(loc.position);

			gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, stride, positionSize);
			gl.enableVertexAttribArray(loc.uv);
		});
	}

	override destroy() {
		this.gl.deleteBuffer(this.buffer);
	}
}
