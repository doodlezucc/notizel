import type { CameraTransform, Size } from '$lib/data/common';
import { GLQuad } from '../webgl/geometry/quad';
import { AnimationRedrawMarker } from '../webgl/redraw-marker';
import { StampBrush, type Brush } from './brush';
import { TemporaryStrokeLayer } from './layers/temporary-stroke-layer';
import type { Stroke, StrokeEvent } from './stroke';

export class RasterDoodlingEngine {
	private readonly gl: WebGL2RenderingContext;
	private readonly marker = new AnimationRedrawMarker(() => this.redraw());

	private readonly clipSpaceQuad: GLQuad;

	private readonly brush: Brush;
	private readonly temporaryStrokeLayer: TemporaryStrokeLayer;

	private camera: CameraTransform;
	private viewport: Size;

	constructor(gl: WebGL2RenderingContext, camera: CameraTransform, size: Size) {
		this.gl = gl;

		this.clipSpaceQuad = GLQuad.fullClipSpace(gl);

		this.brush = new StampBrush(gl, this.clipSpaceQuad);
		this.temporaryStrokeLayer = new TemporaryStrokeLayer(gl, this.marker, size, this.clipSpaceQuad);

		this.camera = camera;
		this.viewport = size;
	}

	dispose() {
		this.marker.dispose();
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

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, viewport.width, viewport.height);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.temporaryStrokeLayer.render(camera, viewport);

		this.camera = camera;
		this.viewport = viewport;
	}

	private redraw() {
		this.render(this.camera, this.viewport);
	}
}
