import type { CameraTransform, Size, Vector } from '$lib/data/common';
import { createWebGLProgram, type WebGLProgramOf } from '../util/webgl-program';
import { createWebGLFullScreenQuad, type WebGLQuad } from '../util/webgl-quad';
import { WebGLStampableTexture } from '../util/webgl-stampable-texture';
import { shaderBrush } from './shaders/brush';
import { shaderUnlitTexture } from './shaders/unlit-texture';

export class RasterDoodlingEngine {
	private readonly gl: WebGL2RenderingContext;

	private readonly unlitTexture: WebGLProgramOf<typeof shaderUnlitTexture>;
	private readonly brush: WebGLProgramOf<typeof shaderBrush>;

	private readonly fullscreenQuad: WebGLQuad;
	private readonly stampable: WebGLStampableTexture;

	constructor(gl: WebGL2RenderingContext, size: Size) {
		this.gl = gl;
		this.unlitTexture = createWebGLProgram(gl, shaderUnlitTexture);
		this.brush = createWebGLProgram(gl, shaderBrush);

		this.fullscreenQuad = createWebGLFullScreenQuad(gl, {
			locations: {
				position: this.unlitTexture.attributes.position,
				uv: this.unlitTexture.attributes.texCoord
			}
		});
		this.stampable = new WebGLStampableTexture(gl, size);
	}

	dispose() {
		this.gl.deleteProgram(this.unlitTexture.program);
		this.gl.deleteBuffer(this.fullscreenQuad.buffer);
		this.gl.deleteVertexArray(this.fullscreenQuad.vao);
		this.stampable.dispose();
	}

	paint(position: Vector, radius: number) {
		this.stampable.paint(() => {
			const gl = this.gl;

			const minX = position.x - radius;
			const minY = position.y - radius;
			const diameter = radius * 2;

			gl.viewport(minX, minY, diameter, diameter);

			gl.enable(gl.SCISSOR_TEST);
			gl.scissor(minX, minY, diameter, diameter);

			gl.enable(gl.BLEND);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

			const quad = createWebGLFullScreenQuad(gl, {
				locations: {
					position: this.brush.attributes.position,
					uv: this.brush.attributes.uv
				}
			});

			gl.useProgram(this.brush.program);
			gl.bindVertexArray(quad.vao);
			gl.uniform4f(this.brush.uniforms.color, 1.0, 0.5, 0.3, 1.0);
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			gl.disable(gl.SCISSOR_TEST);
		});
	}

	render(camera: CameraTransform, viewport: Size) {
		console.log('drawing');

		const gl = this.gl;

		gl.viewport(0, 0, viewport.width, viewport.height);
		gl.clearColor(0.0, 0.0, 0.2, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(this.unlitTexture.program);
		gl.bindVertexArray(this.fullscreenQuad.vao);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.stampable.texture);

		gl.uniform1i(this.unlitTexture.uniforms.texture, 0);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindVertexArray(null);
	}
}
