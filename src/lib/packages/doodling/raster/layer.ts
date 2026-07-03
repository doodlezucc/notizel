import type { CameraTransform, Size } from '$lib/data/common';
import { GLResource } from '../webgl/resource';

export abstract class Layer extends GLResource {
	abstract render(camera: CameraTransform, viewport: Size): void;
}
