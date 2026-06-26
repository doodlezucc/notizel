import type { BoundingBox } from '$lib/data/common';

export abstract class MountedObject {
	abstract computeBoundsInClientSpace(): BoundingBox;
}
