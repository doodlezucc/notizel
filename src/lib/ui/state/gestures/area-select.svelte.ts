import {
	AxisAlignedBoundingBox,
	BoundingBoxes,
	type BoundingBox,
	type ID,
	type Vector
} from '$lib/data/common';
import { AreaSelectGestureState } from './gestures';

export class AreaSelectGestureStateImpl extends AreaSelectGestureState {
	private readonly objects: ObjectAreaSelectInformation[];

	area = $state() as AxisAlignedBoundingBox;
	idsInArea = $state() as ReadonlySet<ID>;

	constructor(objects: ObjectAreaSelectInformation[], initialPointer: Vector) {
		super();
		this.objects = objects;
		this.updateArea(AxisAlignedBoundingBox.fromTopLeft(initialPointer, { width: 0, height: 0 }));
	}

	updateArea(area: AxisAlignedBoundingBox) {
		this.area = area;
		this.idsInArea = new Set(
			this.objects
				.filter((object) => BoundingBoxes.checkOverlapping(area, object.bounds))
				.map((object) => object.id)
		);
	}
}

export interface ObjectAreaSelectInformation {
	id: ID;
	bounds: BoundingBox;
}
