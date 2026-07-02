import type { CameraTransform, Size, Vector } from '$lib/data/common';
import type { GLGeometryShaderBinding } from '../webgl/geometry/geometry-shader-binding';
import { GLQuad } from '../webgl/geometry/quad';
import { GLStampableTexture } from '../webgl/misc/stampable-texture';
import { GLProgram, type GLProgramOf } from '../webgl/program/program';
import { glBindResources } from '../webgl/resource';
import { shaderBrush } from './shaders/brush';
import { shaderUnlitTexture } from './shaders/unlit-texture';

export class RasterDoodlingEngine {
	private readonly gl: WebGL2RenderingContext;

	private readonly unlitTextureProgram: GLProgramOf<typeof shaderUnlitTexture>;
	private readonly brushProgram: GLProgramOf<typeof shaderBrush>;

	private readonly clipSpaceQuad: GLQuad;
	private readonly clipSpaceQuadUnlitVAO: GLGeometryShaderBinding;
	private readonly clipSpaceQuadBrushVAO: GLGeometryShaderBinding;

	private readonly stampable: GLStampableTexture;

	constructor(gl: WebGL2RenderingContext, size: Size) {
		this.gl = gl;
		this.unlitTextureProgram = GLProgram.create(gl, shaderUnlitTexture);
		this.brushProgram = GLProgram.create(gl, shaderBrush);

		this.clipSpaceQuad = GLQuad.fullClipSpace(gl);
		this.clipSpaceQuadUnlitVAO = this.clipSpaceQuad.createShaderBinding({
			position: this.unlitTextureProgram.attributes.position,
			uv: this.unlitTextureProgram.attributes.texCoord
		});
		this.clipSpaceQuadBrushVAO = this.clipSpaceQuad.createShaderBinding({
			position: this.brushProgram.attributes.position,
			uv: this.brushProgram.attributes.uv
		});

		this.stampable = new GLStampableTexture(gl, size);
	}

	dispose() {
		this.unlitTextureProgram.destroy();
		this.brushProgram.destroy();

		this.clipSpaceQuad.destroy();
		this.clipSpaceQuadBrushVAO.destroy();
		this.clipSpaceQuadUnlitVAO.destroy();

		this.stampable.destroy();
	}

	paint(position: Vector, radius: number) {
		const gl = this.gl;

		glBindResources(
			[
				this.stampable.bindFramebuffer(),
				this.clipSpaceQuadBrushVAO.bindVertexArray(),
				this.brushProgram.bindProgram({
					color: (loc) => gl.uniform4f(loc, 1.0, 0.5, 0.3, 1.0)
				})
			],
			() => {
				const minX = position.x - radius;
				const minY = position.y - radius;
				const diameter = radius * 2;

				gl.viewport(minX, minY, diameter, diameter);

				gl.enable(gl.SCISSOR_TEST);
				gl.scissor(minX, minY, diameter, diameter);

				gl.enable(gl.BLEND);
				gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

				gl.drawArrays(gl.TRIANGLES, 0, 6);
				gl.disable(gl.SCISSOR_TEST);
			}
		);
	}

	render(camera: CameraTransform, viewport: Size) {
		console.log('drawing');

		const gl = this.gl;

		gl.viewport(0, 0, viewport.width, viewport.height);
		gl.clearColor(0.0, 0.0, 0.2, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.stampable.texture);

		glBindResources(
			[
				this.clipSpaceQuadUnlitVAO.bindVertexArray(),
				this.unlitTextureProgram.bindProgram({
					texture: (loc) => gl.uniform1i(loc, 0)
				})
			],
			() => {
				gl.disable(gl.DEPTH_TEST);
				gl.disable(gl.BLEND);
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
		);

		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
