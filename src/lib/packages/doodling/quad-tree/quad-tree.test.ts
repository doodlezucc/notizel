import { AxisAlignedBoundingBox } from '$lib/data/common';
import { expect, test } from 'vitest';
import { QuadTree } from './quad-tree';

type Tile = string;

test.each([
	[{ x: -1, y: -1 }, { x: 1, y: 1 }, ['0,0']],
	[{ x: 1.1, y: -1 }, { x: 1.5, y: 1 }, []],
	[{ x: -1, y: 1.1 }, { x: 1, y: 1.5 }, []],
	[{ x: -1, y: -1 }, { x: -0.1, y: 1 }, []],
	[{ x: -1, y: -1 }, { x: 1, y: -0.1 }, []],
	[{ x: 0, y: 0 }, { x: 0.1, y: 0.1 }, ['0,0']],
	[{ x: 0.9, y: 0.9 }, { x: 1, y: 1 }, ['0,0']],
	[{ x: 0, y: -2.5 }, { x: 3, y: 0.1 }, ['0,0', '2,-3']]
])('Arbitrary quad tree example $0 $1', (a, b, expectedTiles) => {
	const tree = new QuadTree<Tile>();

	tree.addTileUnsafe(0, { x: 0, y: 0 }, '0,0');
	tree.addTileUnsafe(0, { x: 2, y: -3 }, '2,-3');
	tree.addTileUnsafe(0, { x: -5, y: 2 }, '-5,2');

	expect(tree.findTilesOverlappingBox(AxisAlignedBoundingBox.fromPoints(a, b))).toEqual(
		expectedTiles
	);
});

test('1-level grid', () => {
	const tree = new QuadTree<Tile>();

	for (let x = -5; x <= 5; x++) {
		for (let y = -5; y <= 5; y++) {
			tree.addTileUnsafe(0, { x, y }, `${x},${y}`);
		}
	}

	tree.increaseRootLevel();
	tree.increaseRootLevel();

	expect(
		tree.findTilesOverlappingBox(
			AxisAlignedBoundingBox.fromPoints({ x: 1.8, y: 1.3 }, { x: 3.2, y: 1.9 })
		)
	).toEqual(['1,1', '2,1', '3,1']);
});
