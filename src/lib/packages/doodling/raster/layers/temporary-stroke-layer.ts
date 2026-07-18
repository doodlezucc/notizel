import { AxisAlignedBoundingBox, Vectors, type CameraTransform, type Size } from '$lib/data/common';
import type { LTRBRect } from '../../quad-tree/quad-tree';
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
import type { OverlayedTexture } from '../tiling/tile-layer';

interface TemporaryStrokeLayerHandler {
	applyTexture: (texture: OverlayedTexture) => void;
}

export class TemporaryStrokeLayer extends Layer {
	private readonly marker: RedrawMarker;
	private readonly drawableTexture: GLDrawableTexture;
	private readonly handler: TemporaryStrokeLayerHandler;

	private readonly unlitTextureProgram: GLProgramOf<typeof shaderUnlitTexture>;
	private readonly clipSpaceQuadUnlitVAO: GLGeometryShaderBinding;

	private readonly currentStrokes = new Set<Stroke>();
	private currentViewport!: LTRBRect;
	private currentZoom!: number;
	private currentTextureBounds!: LTRBRect;
	private currentCropBounds?: AxisAlignedBoundingBox;
	private currentDetailLevel!: number;

	constructor(
		gl: GL,
		redrawMarker: RedrawMarker,
		handler: TemporaryStrokeLayerHandler,
		size: Size,
		clipSpaceQuad: GLQuad
	) {
		super(gl);

		this.marker = redrawMarker;
		this.handler = handler;
		this.drawableTexture = new GLDrawableTexture(gl, size);
		this.unlitTextureProgram = GLProgram.create(gl, shaderUnlitTexture);
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
		const halfWidthPixels = viewport.width / camera.scale / 2;
		const halfHeightPixels = viewport.height / camera.scale / 2;

		this.currentViewport = {
			topLeft: {
				x: -camera.position.x - halfWidthPixels,
				y: -camera.position.y - halfHeightPixels
			},
			bottomRight: {
				x: -camera.position.x + halfWidthPixels,
				y: -camera.position.y + halfHeightPixels
			}
		};
		this.currentZoom = 1 / camera.scale;
		this.currentTextureBounds = this.currentViewport;
		this.currentDetailLevel = Math.floor(Math.log2(1 / camera.scale));

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
		const newStroke = new StrokeImpl(this, this.marker, brush, radiusSetting, (bounds) =>
			this.onStrokeCompleted(newStroke, bounds)
		);
		this.currentStrokes.add(newStroke);
		return newStroke;
	}

	private onStrokeCompleted(stroke: Stroke, bounds: AxisAlignedBoundingBox) {
		this.currentStrokes.delete(stroke);

		if (!this.currentCropBounds) {
			this.currentCropBounds = bounds;
		} else {
			this.currentCropBounds = this.currentCropBounds.growToInclude(bounds);
		}

		if (this.currentStrokes.size === 0) {
			this.writeToCanvas();
			this.currentCropBounds = undefined;
		}
	}

	private writeToCanvas() {
		this.handler.applyTexture({
			texture: this.drawableTexture.texture,
			textureBounds: this.currentTextureBounds,
			cropBounds: {
				topLeft: Vectors.add(
					this.currentViewport.topLeft,
					Vectors.scale(this.currentCropBounds!.topLeft, this.currentZoom)
				),
				bottomRight: Vectors.add(
					this.currentViewport.topLeft,
					Vectors.scale(this.currentCropBounds!.bottomRight, this.currentZoom)
				)
			},
			detailLevel: this.currentDetailLevel
		});

		this.drawableTexture.clear();
		this.marker.markNeedsRedraw();
	}
}

class StrokeImpl extends Stroke {
	private readonly layer: TemporaryStrokeLayer;
	private readonly marker: RedrawMarker;
	private readonly brush: Brush;
	private readonly radius: number;
	private readonly onComplete: (bounds: AxisAlignedBoundingBox) => void;

	private bounds!: AxisAlignedBoundingBox;

	constructor(
		layer: TemporaryStrokeLayer,
		marker: RedrawMarker,
		brush: Brush,
		radius: number,
		onComplete: (bounds: AxisAlignedBoundingBox) => void
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

		this.bounds = AxisAlignedBoundingBox.fromCenter(point.position, {
			width: point.radius,
			height: point.radius
		});

		this.layer.bindFramebuffer();
		this.brush.drawInitialPoint(point);
		this.marker.markNeedsRedraw();
	}

	protected drawSegment(from: StrokeEvent, to: StrokeEvent): void {
		const segment = new LinearStrokeSegment(
			this.transformEventToPoint(from),
			this.transformEventToPoint(to)
		);

		this.bounds = this.bounds.growToInclude(segment.computeBoundingBox());

		this.layer.bindFramebuffer();
		this.brush.drawSegment(segment);
		this.marker.markNeedsRedraw();
	}

	complete(): void {
		this.onComplete(this.bounds);
	}
}
