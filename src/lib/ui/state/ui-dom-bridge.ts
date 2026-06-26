import type { ID } from '$lib/data/common';
import type { MountedObject } from './dom-bridge/object';

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
