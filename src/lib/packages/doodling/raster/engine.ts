import type { CameraTransform, Size } from '$lib/data/common';
import type { GLGeometryShaderBinding } from '../webgl/geometry/geometry-shader-binding';
import { GLQuad } from '../webgl/geometry/quad';
import { GLStampableTexture } from '../webgl/misc/stampable-texture';
import { GLProgram, type GLProgramOf } from '../webgl/program/program';
import { glBindResources } from '../webgl/resource';
import { StampBrush, type Brush } from './brush';
import { shaderUnlitTexture } from './shaders/unlit-texture';
import { LinearStrokeSegment, type StrokePoint } from './stroke-segment';

export class RasterDoodlingEngine {
	private readonly gl: WebGL2RenderingContext;

	private readonly unlitTextureProgram: GLProgramOf<typeof shaderUnlitTexture>;

	private readonly clipSpaceQuad: GLQuad;
	private readonly clipSpaceQuadUnlitVAO: GLGeometryShaderBinding;
	private readonly stampable: GLStampableTexture;

	private readonly brush: Brush;

	constructor(gl: WebGL2RenderingContext, size: Size) {
		this.gl = gl;
		this.unlitTextureProgram = GLProgram.create(gl, shaderUnlitTexture);

		this.clipSpaceQuad = GLQuad.fullClipSpace(gl);
		this.clipSpaceQuadUnlitVAO = this.clipSpaceQuad.createShaderBinding({
			position: this.unlitTextureProgram.attributes.position,
			uv: this.unlitTextureProgram.attributes.texCoord
		});
		this.stampable = new GLStampableTexture(gl, size);

		this.brush = new StampBrush(gl, this.clipSpaceQuad);
	}

	dispose() {
		this.unlitTextureProgram.destroy();

		this.clipSpaceQuad.destroy();
		this.clipSpaceQuadUnlitVAO.destroy();
		this.stampable.destroy();

		this.brush.destroy();
	}

	paintPointWithBrush(point: StrokePoint) {
		glBindResources([this.stampable.bindFramebuffer()], () => {
			this.brush.drawInitialPoint(point);
		});
	}

	paintSegmentWithBrush(from: StrokePoint, to: StrokePoint) {
		const segment = new LinearStrokeSegment(from, to);

		glBindResources([this.stampable.bindFramebuffer()], () => {
			this.brush.drawSegment(segment);
		});
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
