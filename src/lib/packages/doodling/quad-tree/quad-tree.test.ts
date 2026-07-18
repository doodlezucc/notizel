import type { Vector } from '$lib/data/common';
import { expect, test, vi } from 'vitest';
import { QuadTree, type QuadrantTuple, type Tile, type TileDataProvider } from './quad-tree';

type TileData = string;

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
	const tree = new QuadTree<TileData>();

	tree.addTileUnsafe(0, { x: 0, y: 0 }, '0,0');
	tree.addTileUnsafe(0, { x: 2, y: -3 }, '2,-3');
	tree.addTileUnsafe(0, { x: -5, y: 2 }, '-5,2');

	expect(
		tree.findTilesOverlappingRect({ topLeft: a, bottomRight: b }).map((tile) => tile.data)
	).toEqual(expectedTiles);
});

test('1-level grid', () => {
	const tree = new QuadTree<TileData>();

	for (let x = -5; x <= 5; x++) {
		for (let y = -5; y <= 5; y++) {
			tree.addTileUnsafe(0, { x, y }, `${x},${y}`);
		}
	}

	tree.increaseRootLevel();
	tree.increaseRootLevel();

	expect(
		tree
			.findTilesOverlappingRect({
				topLeft: { x: 1.8, y: 1.3 },
				bottomRight: { x: 3.2, y: 1.9 }
			})
			.map((tile) => tile.data)
	).toEqual(['1,1', '2,1', '3,1']);
});

test('Populate flat level grid 1 level smaller', () => {
	const tree = new QuadTree<TileData>();

	for (let x = -1; x <= 0; x++) {
		for (let y = -1; y <= 0; y++) {
			tree.addTileUnsafe(0, { x, y }, `0(${x},${y})`);
		}
	}

	const dataProvider = {
		createTile: vi.fn((level: number, { x, y }: Vector): TileData => `${level}(${x},${y})`),
		disposeTile: vi.fn<(tile: Tile<TileData>) => void>(),
		subdivideTile: vi.fn(
			({ level, position: { x, y } }: Tile<TileData>): QuadrantTuple<TileData> => [
				`${level - 1}(${x * 2},${y * 2})`,
				`${level - 1}(${x * 2 + 1},${y * 2})`,
				`${level - 1}(${x * 2},${y * 2 + 1})`,
				`${level - 1}(${x * 2 + 1},${y * 2 + 1})`
			]
		)
	} satisfies TileDataProvider<TileData>;

	const overlappingTiles = tree.populateTilesOverlappingRect(
		{
			topLeft: { x: -0.75, y: 0.6 },
			bottomRight: { x: 1.25, y: 0.7 }
		},
		{
			dataProvider: dataProvider,
			targetLevel: -1
		}
	);

	expect(overlappingTiles).toHaveLength(5);
	expect(overlappingTiles).toEqual(
		expect.arrayContaining([
			expect.objectContaining<Tile<TileData>>({
				data: '-1(-2,1)',
				level: -1,
				position: { x: -2, y: 1 }
			}),
			expect.objectContaining<Tile<TileData>>({
				data: '-1(-1,1)',
				level: -1,
				position: { x: -1, y: 1 }
			}),
			expect.objectContaining<Tile<TileData>>({
				data: '-1(0,1)',
				level: -1,
				position: { x: 0, y: 1 }
			}),
			expect.objectContaining<Tile<TileData>>({
				data: '-1(1,1)',
				level: -1,
				position: { x: 1, y: 1 }
			}),
			expect.objectContaining<Tile<TileData>>({
				data: '-1(2,1)',
				level: -1,
				position: { x: 2, y: 1 }
			})
		])
	);

	// Assert -1,0 and 0,0 to have been subdivided
	expect(dataProvider.subdivideTile).toHaveBeenCalledTimes(2);
	expect(dataProvider.subdivideTile.mock.calls[0][0].data).toEqual('0(-1,0)');
	expect(dataProvider.subdivideTile.mock.calls[1][0].data).toEqual('0(0,0)');

	// Assert -1,0 and 0,0 to have been disposed after subdividing
	expect(dataProvider.disposeTile).toHaveBeenCalledTimes(2);
	expect(dataProvider.disposeTile.mock.calls[0][0].data).toEqual('0(-1,0)');
	expect(dataProvider.disposeTile.mock.calls[1][0].data).toEqual('0(0,0)');

	// Assert only a single new leaf to have been created
	expect(dataProvider.createTile).toHaveBeenCalledExactlyOnceWith(-1, { x: 2, y: 1 });
});

test('Populate flat level grid 2 levels smaller', () => {
	const tree = new QuadTree<TileData>();
	tree.increaseRootLevel();
	tree.addTileUnsafe(1, { x: 0, y: 0 }, `1(0,0)`);

	const dataProvider = {
		createTile: vi.fn((level: number, { x, y }: Vector): TileData => `${level}(${x},${y})`),
		disposeTile: vi.fn<(tile: Tile<TileData>) => void>(),
		subdivideTile: vi.fn(
			({ level, position: { x, y } }: Tile<TileData>): QuadrantTuple<TileData> => [
				`${level - 1}(${x * 2},${y * 2})`,
				`${level - 1}(${x * 2 + 1},${y * 2})`,
				`${level - 1}(${x * 2},${y * 2 + 1})`,
				`${level - 1}(${x * 2 + 1},${y * 2 + 1})`
			]
		)
	} satisfies TileDataProvider<TileData>;

	const overlappingTiles = tree.populateTilesOverlappingRect(
		{
			topLeft: { x: -0.6, y: -0.1 },
			bottomRight: { x: 2.1, y: 0.6 }
		},
		{
			dataProvider: dataProvider,
			targetLevel: -1
		}
	);

	expect(overlappingTiles).toHaveLength(21);
	expect(overlappingTiles.map((tile) => tile.data)).toEqual(
		expect.arrayContaining([
			...['-1(-2,-1)', '-1(-1,-1)', '-1(0,-1)', '-1(1,-1)', '-1(2,-1)', '-1(3,-1)', '-1(4,-1)'],
			...['-1(-2,0)', '-1(-1,0)', '-1(0,0)', '-1(1,0)', '-1(2,0)', '-1(3,0)', '-1(4,0)'],
			...['-1(-2,1)', '-1(-1,1)', '-1(0,1)', '-1(1,1)', '-1(2,1)', '-1(3,1)', '-1(4,1)']
		])
	);

	// Assert the initial level 1 tile to have been subdivided
	// Assert -1,0 and 0,0 to have been subdivided further
	expect(dataProvider.subdivideTile).toHaveBeenCalledTimes(3);
	expect(dataProvider.subdivideTile.mock.calls[0][0].data).toEqual('1(0,0)');
	expect(dataProvider.subdivideTile.mock.calls[1][0].data).toEqual('0(0,0)');
	expect(dataProvider.subdivideTile.mock.calls[2][0].data).toEqual('0(1,0)');

	// Assert subdivided tiles to have been disposed
	expect(dataProvider.disposeTile).toHaveBeenCalledTimes(3);
	expect(dataProvider.disposeTile.mock.calls[0][0].data).toEqual('1(0,0)');
	expect(dataProvider.disposeTile.mock.calls[1][0].data).toEqual('0(0,0)');
	expect(dataProvider.disposeTile.mock.calls[2][0].data).toEqual('0(1,0)');

	// Assert new level -1 leaves to have been created (excluding tiles created through subdivision)
	expect(dataProvider.createTile).toHaveBeenCalledTimes(13);
	expect(dataProvider.createTile.mock.calls).toEqual(
		expect.arrayContaining([
			// Tiles to the left of the initial level 1 tile
			[-1, { x: -2, y: -1 }],
			[-1, { x: -1, y: -1 }],
			[-1, { x: -2, y: 0 }],
			[-1, { x: -1, y: 0 }],
			[-1, { x: -2, y: 1 }],
			[-1, { x: -1, y: 1 }],

			// Tiles above the initial level 1 tile
			[-1, { x: 0, y: -1 }],
			[-1, { x: 1, y: -1 }],
			[-1, { x: 2, y: -1 }],
			[-1, { x: 3, y: -1 }],

			// Tiles to the right of the initial level 1 tile
			[-1, { x: 4, y: -1 }],
			[-1, { x: 4, y: 0 }],
			[-1, { x: 4, y: 1 }]
		])
	);
});
