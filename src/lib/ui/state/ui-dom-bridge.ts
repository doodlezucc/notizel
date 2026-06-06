import type { BoundingBox, ID } from '$lib/data/common';

export class UIDOMBridge {
	private readonly mountedObjects = new Map<ID, MountedObject>();

	getHandle(objectId: ID) {
		return this.mountedObjects.get(objectId);
	}

	registerMountedObject(objectId: ID, handle: MountedObject) {
		if (this.mountedObjects.has(objectId)) {
			this.unregisterMountedObject(objectId);
		}

		this.mountedObjects.set(objectId, handle);
	}

	unregisterMountedObject(objectId: ID) {
		this.mountedObjects.delete(objectId);
	}
}

export interface MountedObject {
	computeBoundsInClientSpace(): BoundingBox;
}
