import type { CameraTransform, Size } from '$lib/data/common';
import { GLQuad } from '../webgl/geometry/quad';
import { StampBrush, type Brush } from './brush';
import { TemporaryStrokeLayer } from './layers/temporary-stroke-layer';
import type { Stroke, StrokeEvent } from './stroke';

export class RasterDoodlingEngine {
	private readonly gl: WebGL2RenderingContext;

	private readonly clipSpaceQuad: GLQuad;

	private readonly brush: Brush;
	private readonly temporaryStrokeLayer: TemporaryStrokeLayer;

	constructor(gl: WebGL2RenderingContext, size: Size) {
		this.gl = gl;

		this.clipSpaceQuad = GLQuad.fullClipSpace(gl);

		this.brush = new StampBrush(gl, this.clipSpaceQuad);
		this.temporaryStrokeLayer = new TemporaryStrokeLayer(gl, size, this.clipSpaceQuad);
	}

	dispose() {
		this.clipSpaceQuad.destroy();

		this.brush.destroy();
		this.temporaryStrokeLayer.destroy();
	}

	startStroke(initialEvent: StrokeEvent, radiusSetting: number): Stroke {
		const stroke = this.temporaryStrokeLayer.createStroke(this.brush, radiusSetting);
		stroke.emit(initialEvent);

		return stroke;
	}

	render(camera: CameraTransform, viewport: Size) {
		console.log('drawing');

		const gl = this.gl;

		gl.viewport(0, 0, viewport.width, viewport.height);
		gl.clearColor(0.0, 0.0, 0.2, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.temporaryStrokeLayer.render(camera, viewport);
	}
}
