import type { CameraTransform, Size } from '$lib/data/common';
import type { GLGeometryShaderBinding } from '../../webgl/geometry/geometry-shader-binding';
import type { GLQuad } from '../../webgl/geometry/quad';
import { GLDrawableTexture } from '../../webgl/misc/drawable-texture';
import { GLProgram, type GLProgramOf } from '../../webgl/program/program';
import { glBindResources, type GL, type UnbindFunction } from '../../webgl/resource';
import type { Brush } from '../brush';
import { Layer } from '../layer';
import { shaderUnlitTexture } from '../shaders/unlit-texture';
import { Stroke, type StrokeEvent } from '../stroke';
import { LinearStrokeSegment, type StrokePoint } from '../stroke-segment';

export class TemporaryStrokeLayer extends Layer {
	private readonly drawableTexture: GLDrawableTexture;

	private readonly unlitTextureProgram: GLProgramOf<typeof shaderUnlitTexture>;
	private readonly clipSpaceQuadUnlitVAO: GLGeometryShaderBinding;

	constructor(gl: GL, size: Size, clipSpaceQuad: GLQuad) {
		super(gl);

		this.unlitTextureProgram = GLProgram.create(gl, shaderUnlitTexture);
		this.drawableTexture = new GLDrawableTexture(gl, size);
		this.clipSpaceQuadUnlitVAO = clipSpaceQuad.createShaderBinding({
			position: this.unlitTextureProgram.attributes.position,
			uv: this.unlitTextureProgram.attributes.texCoord
		});
	}

	override destroy() {
		this.drawableTexture.destroy();
		this.unlitTextureProgram.destroy();
		this.clipSpaceQuadUnlitVAO.destroy();
	}

	override render(camera: CameraTransform, viewport: Size) {
		const gl = this.gl;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.drawableTexture.texture);

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

	bindFramebuffer(): UnbindFunction {
		return this.drawableTexture.bindFramebuffer();
	}

	createStroke(brush: Brush, radiusSetting: number): Stroke {
		return new StrokeImpl(this, brush, radiusSetting);
	}
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
