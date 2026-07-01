import type { Vector } from '$lib/data/common';

interface QuadAttributeLocations {
	position: GLint;
	uv: GLint;
}

interface CreateQuadOptions {
	topLeft: Vector;
	bottomRight: Vector;
	locations: QuadAttributeLocations;
}

export interface WebGLQuad {
	vao: WebGLVertexArrayObject;
	buffer: WebGLBuffer;
}

export function createWebGLQuad(gl: WebGL2RenderingContext, options: CreateQuadOptions): WebGLQuad {
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const { x: ax, y: ay } = options.topLeft;
	const { x: bx, y: by } = options.bottomRight;

	// prettier-ignore
	const vertices = new Float32Array([
    /*  x,  y       u, v  */
        ax, ay,     0, 1,
        bx, ay,     1, 1,
        ax, by,     0, 0,
        bx, ay,     1, 1,
        bx, by,     1, 0,
        ax, by,     0, 0,
    ]);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	const loc = options.locations;
	const stride = 4 * Float32Array.BYTES_PER_ELEMENT;

	gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, stride, 0);
	gl.enableVertexAttribArray(loc.position);

	gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
	gl.enableVertexAttribArray(loc.uv);

	gl.bindVertexArray(null);
	return { vao, buffer };
}

interface CreateFullScreenQuadOptions {
	locations: QuadAttributeLocations;
}

export function createWebGLFullScreenQuad(
	gl: WebGL2RenderingContext,
	options: CreateFullScreenQuadOptions
) {
	return createWebGLQuad(gl, {
		locations: options.locations,
		topLeft: { x: -1, y: -1 },
		bottomRight: { x: 1, y: 1 }
	});
}
