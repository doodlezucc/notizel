import { describe, expect, test } from 'vitest';
import { AxisAlignedBoundingBox, BoundingBoxes } from './bounding-box';

describe('Check overlapping AABBs', () => {
	const rect2x1To3x3 = AxisAlignedBoundingBox.fromPoints({ x: 2, y: 1 }, { x: 3, y: 3 });

	test('Equal rectangles', () => {
		expect(BoundingBoxes.checkOverlapping(rect2x1To3x3, rect2x1To3x3)).toEqual(true);
	});

	test('No overlap to the top left', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromTopLeft({ x: -5, y: -5 }, { width: 1, height: 1 })
			)
		).toEqual(false);
	});

	test('No overlap to the top right', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromTopLeft({ x: 5, y: -5 }, { width: 1, height: 1 })
			)
		).toEqual(false);
	});

	test('No overlap to the bottom right', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromTopLeft({ x: 5, y: 5 }, { width: 1, height: 1 })
			)
		).toEqual(false);
	});

	test('No overlap to the bottom left', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromTopLeft({ x: -5, y: 5 }, { width: 1, height: 1 })
			)
		).toEqual(false);
	});

	test('Soft overlap at left edge', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromPoints({ x: -5, y: 1 }, { x: 2, y: 3 })
			)
		).toEqual(true);
	});

	test('Soft overlap at top edge', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromPoints({ x: 2, y: -5 }, { x: 3, y: 1 })
			)
		).toEqual(true);
	});

	test('Soft overlap at right edge', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromPoints({ x: 3, y: 1 }, { x: 5, y: 3 })
			)
		).toEqual(true);
	});

	test('Soft overlap at bottom edge', () => {
		expect(
			BoundingBoxes.checkOverlapping(
				rect2x1To3x3,
				AxisAlignedBoundingBox.fromPoints({ x: 2, y: 3 }, { x: 3, y: 5 })
			)
		).toEqual(true);
	});
});
