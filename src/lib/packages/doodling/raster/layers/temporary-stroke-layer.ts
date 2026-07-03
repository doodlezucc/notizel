import type { CameraTransform, Size } from '$lib/data/common';
import type { GLGeometryShaderBinding } from '../../webgl/geometry/geometry-shader-binding';
import type { GLQuad } from '../../webgl/geometry/quad';
import { GLDrawableTexture } from '../../webgl/misc/drawable-texture';
import { GLProgram, type GLProgramOf } from '../../webgl/program/program';
import type { RedrawMarker } from '../../webgl/redraw-marker';
import type { GL } from '../../webgl/resource';
import type { Brush } from '../brush';
import { Layer } from '../layer';
import { shaderUnlitTexture } from '../shaders/unlit-texture';
import { Stroke, type StrokeEvent } from '../stroke';
import { LinearStrokeSegment, type StrokePoint } from '../stroke-segment';

export class TemporaryStrokeLayer extends Layer {
	private readonly marker: RedrawMarker;
	private readonly drawableTexture: GLDrawableTexture;

	private readonly unlitTextureProgram: GLProgramOf<typeof shaderUnlitTexture>;
	private readonly clipSpaceQuadUnlitVAO: GLGeometryShaderBinding;

	private readonly currentStrokes = new Set<Stroke>();

	constructor(gl: GL, redrawMarker: RedrawMarker, size: Size, clipSpaceQuad: GLQuad) {
		super(gl);

		this.marker = redrawMarker;
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
		if (this.currentStrokes.size === 0) {
			// No stroke is currently being drawn, skip this layer.
			return;
		}

		const gl = this.gl;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.drawableTexture.texture);

		this.clipSpaceQuadUnlitVAO.bindVertexArray();
		this.unlitTextureProgram.bindProgram({
			texture: (loc) => gl.uniform1i(loc, 0)
		});

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	bindFramebuffer() {
		this.drawableTexture.bindFramebuffer();
	}

	createStroke(brush: Brush, radiusSetting: number): Stroke {
		const newStroke = new StrokeImpl(this, this.marker, brush, radiusSetting, () =>
			this.onStrokeCompleted(newStroke)
		);
		this.currentStrokes.add(newStroke);
		return newStroke;
	}

	private onStrokeCompleted(stroke: Stroke) {
		this.currentStrokes.delete(stroke);

		if (this.currentStrokes.size === 0) {
			this.writeToCanvas();
		}
	}

	private writeToCanvas() {
		this.marker.markNeedsRedraw();
		this.drawableTexture.clear();
	}
}

class StrokeImpl extends Stroke {
	private readonly layer: TemporaryStrokeLayer;
	private readonly marker: RedrawMarker;
	private readonly brush: Brush;
	private readonly radius: number;
	private readonly onComplete: () => void;

	constructor(
		layer: TemporaryStrokeLayer,
		marker: RedrawMarker,
		brush: Brush,
		radius: number,
		onComplete: () => void
	) {
		super();
		this.layer = layer;
		this.marker = marker;
		this.brush = brush;
		this.radius = radius;
		this.onComplete = onComplete;
	}

	private transformEventToPoint(event: StrokeEvent): StrokePoint {
		return {
			position: event.pointer,
			radius: event.pressure * this.radius
		};
	}

	protected drawInitialEvent(event: StrokeEvent): void {
		const point = this.transformEventToPoint(event);

		this.layer.bindFramebuffer();
		this.brush.drawInitialPoint(point);
		this.marker.markNeedsRedraw();
	}

	protected drawSegment(from: StrokeEvent, to: StrokeEvent): void {
		const segment = new LinearStrokeSegment(
			this.transformEventToPoint(from),
			this.transformEventToPoint(to)
		);

		this.layer.bindFramebuffer();
		this.brush.drawSegment(segment);
		this.marker.markNeedsRedraw();
	}

	complete(): void {
		this.onComplete();
	}
}
