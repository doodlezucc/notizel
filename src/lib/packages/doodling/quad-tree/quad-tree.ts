import { Vectors, type Vector } from '$lib/data/common';

export interface TileLocation {
	level: number;
	/** Integer coordinates from the origin, unique in this `level`. */
	position: Vector;
}

export interface Tile<T> extends TileLocation {
	data: T;
}

export interface TileDataProvider<T> {
	createTile: (level: number, position: Vector) => T;
	subdivideTile: (tile: Tile<T>) => QuadrantTuple<T>;
	disposeTile: (tile: Tile<T>) => void;
}

type Coord = `${number};${number}`;

function tileCoord(x: number, y: number): Coord {
	return `${x};${y}`;
}

export interface LTRBRect {
	topLeft: Vector;
	bottomRight: Vector;
}

interface PopulateOptions<T> {
	targetLevel: number;
	dataProvider: TileDataProvider<T>;
}

interface PopulateContainerOptions<T> {
	rect?: LTRBRect;
	levelOffset: number;
	dataProvider: TileDataProvider<T>;
}

// One arbitrary decision:
// Levels are sorted so that a smaller number means a smaller tile.
// Level 0 is at default scale.
// Level -1 is half the default size.
// Level 1 is double the default size.

export class QuadTree<T> {
	private rootLevel = 0;
	private rootNodes = new Map<Coord, TreeNode<T>>();

	addTileUnsafe(level: number, position: Vector, data: T) {
		const key = tileCoord(position.x, position.y);
		const node = new TreeTileNode(data, level, position);

		this.rootNodes.set(key, node);
	}

	increaseRootLevel() {
		const newLevel = this.rootLevel + 1;
		const newRootNodes = new Map<Coord, TreeNode<T>>();

		for (const node of this.rootNodes.values()) {
			const nodePosition = node.position;
			const containerPosition = {
				x: Math.floor(nodePosition.x / 2),
				y: Math.floor(nodePosition.y / 2)
			};

			const containerKey = tileCoord(containerPosition.x, containerPosition.y);
			let container = newRootNodes.get(containerKey) as TreeContainerNode<T> | undefined;

			if (!container) {
				container = new TreeContainerNode<T>(newLevel, containerPosition);
				newRootNodes.set(containerKey, container);
			}

			container.setChild(
				nodePosition.x - containerPosition.x * 2,
				nodePosition.y - containerPosition.y * 2,
				node
			);
		}

		this.rootLevel = newLevel;
		this.rootNodes = newRootNodes;
	}

	// TODO: In the future, this should use some sort of "diff" approach. Right now,
	// subdividing a data tile multiple times (so, tile -> tiles inside containers inside container)
	// requires an unnecessary intermediate dataProvider.subdivide(...) call.
	populateTilesOverlappingRect(rect: LTRBRect, options: PopulateOptions<T>): Tile<T>[] {
		const result: Tile<T>[] = [];

		const { targetLevel, dataProvider } = options;

		while (this.rootLevel < targetLevel) {
			this.increaseRootLevel();
		}

		const rootTileSize = Math.pow(2, this.rootLevel);
		const inverseRootTileSize = 1 / rootTileSize;

		const { topLeft, bottomRight } = rect;
		const minX = topLeft.x * inverseRootTileSize;
		const minY = topLeft.y * inverseRootTileSize;
		const maxX = bottomRight.x * inverseRootTileSize;
		const maxY = bottomRight.y * inverseRootTileSize;

		const minTileX = Math.floor(minX);
		const minTileY = Math.floor(minY);
		const maxTileX = Math.ceil(maxX);
		const maxTileY = Math.ceil(maxY);

		const isEdge = (x: number, y: number) => {
			return y === minTileY || y === maxTileY - 1 || x === minTileX || x === maxTileX - 1;
		};

		for (let x = minTileX; x < maxTileX; x++) {
			for (let y = minTileY; y < maxTileY; y++) {
				const key = tileCoord(x, y);
				let rootNode = this.rootNodes.get(key);

				if (!rootNode) {
					if (this.rootLevel === targetLevel) {
						const newTileData = dataProvider.createTile(this.rootLevel, { x, y });
						rootNode = new TreeTileNode(newTileData, this.rootLevel, { x, y });
					} else {
						rootNode = new TreeContainerNode(this.rootLevel, { x, y });
					}

					this.rootNodes.set(key, rootNode);
				} else if (targetLevel < this.rootLevel && rootNode instanceof TreeTileNode) {
					// Root tile node needs to be converted into a container node

					const quadrantData = dataProvider.subdivideTile(rootNode);
					const newContainerNode = rootNode.toContainerNode(quadrantData);

					// Dispose tile in favor of the 4 new tiles
					dataProvider.disposeTile(rootNode);

					rootNode = newContainerNode;
					this.rootNodes.set(key, newContainerNode);
				}

				if (rootNode instanceof TreeTileNode) {
					result.push(rootNode);
				} else if (rootNode instanceof TreeContainerNode) {
					result.push(
						...rootNode.populate({
							dataProvider: dataProvider,
							levelOffset: targetLevel - this.rootLevel + 1,

							// Only tiles at the edges need to be "partially" populated.
							// All fully surrounded tiles must be populated entirely, so
							// the overlap check can be skipped.
							rect: isEdge(x, y)
								? {
										topLeft: { x: minX - x, y: minY - y },
										bottomRight: { x: maxX - x, y: maxY - y }
									}
								: undefined
						})
					);
				}
			}
		}

		return result;
	}

	findTilesOverlappingRect(rect: LTRBRect): Tile<T>[] {
		const result: Tile<T>[] = [];

		const rootTileSize = Math.pow(2, this.rootLevel);
		const inverseRootTileSize = 1 / rootTileSize;

		const minX = rect.topLeft.x * inverseRootTileSize;
		const minY = rect.topLeft.y * inverseRootTileSize;
		const maxX = rect.bottomRight.x * inverseRootTileSize;
		const maxY = rect.bottomRight.y * inverseRootTileSize;

		const minTileX = Math.floor(minX);
		const minTileY = Math.floor(minY);
		const maxTileX = Math.ceil(maxX);
		const maxTileY = Math.ceil(maxY);

		const isEdge = (x: number, y: number) => {
			return y === minTileY || y === maxTileY - 1 || x === minTileX || x === maxTileX - 1;
		};

		for (let x = minTileX; x < maxTileX; x++) {
			for (let y = minTileY; y < maxTileY; y++) {
				const node = this.rootNodes.get(tileCoord(x, y));
				if (node) {
					if (node instanceof TreeContainerNode && isEdge(x, y)) {
						result.push(
							...node.getDescendantTilesInBounds({
								topLeft: {
									x: minX - x,
									y: minY - y
								},
								bottomRight: {
									x: maxX - x,
									y: maxY - y
								}
							})
						);
					} else {
						result.push(...node.selfOrDescendants);
					}
				}
			}
		}

		return result;
	}
}

abstract class TreeNode<T> implements TileLocation {
	readonly level: number;
	readonly position: Vector;

	constructor(level: number, position: Vector) {
		this.level = level;
		this.position = position;
	}

	abstract get selfOrDescendants(): Tile<T>[];
}

export type QuadrantTuple<T> = [
	topLeft: T | null,
	topRight: T | null,
	bottomLeft: T | null,
	bottomRight: T | null
];

interface ProcessQuadrantsOptions {
	rect?: LTRBRect;
}

interface QuadrantContext {
	positionInContainer: Vector;
	localRect?: LTRBRect;
}

class TreeContainerNode<T> extends TreeNode<T> {
	private readonly children: QuadrantTuple<TreeNode<T>>;

	constructor(level: number, position: Vector, children?: QuadrantTuple<TreeNode<T>>) {
		super(level, position);
		this.children = children ?? [null, null, null, null];
	}

	override get selfOrDescendants(): Tile<T>[] {
		const result: Tile<T>[] = [];

		for (const child of this.children) {
			if (child) {
				result.push(...child.selfOrDescendants);
			}
		}

		return result;
	}

	setChild(x: number, y: number, node: TreeNode<T>) {
		this.children[x + y * 2] = node;
	}

	private processAllQuadrants(
		processQuadrant: (node: TreeNode<T> | null, context: QuadrantContext) => TreeNode<T> | null
	) {
		for (let x = 0; x < 2; x++) {
			for (let y = 0; y < 2; y++) {
				this.children[x + y * 2] = processQuadrant(this.children[x + y * 2], {
					positionInContainer: { x, y }
				});
			}
		}
	}

	private processQuadrants(
		processQuadrant: (node: TreeNode<T> | null, context: QuadrantContext) => TreeNode<T> | null,
		{ rect }: ProcessQuadrantsOptions = {}
	) {
		if (!rect) {
			this.processAllQuadrants(processQuadrant);
			return;
		}

		const {
			topLeft: { x: ax, y: ay },
			bottomRight: { x: bx, y: by }
		} = rect;

		if (ax > 1 || ay > 1 || bx < 0 || by < 0) {
			return;
		}

		if (ax <= 0 && ay <= 0 && bx >= 1 && by >= 1) {
			this.processAllQuadrants(processQuadrant);
			return;
		}

		const computeQuadrantContext = (position: Vector): QuadrantContext => {
			return {
				positionInContainer: position,
				localRect: {
					topLeft: { x: ax * 2 - position.x, y: ay * 2 - position.y },
					bottomRight: { x: bx * 2 - position.x, y: by * 2 - position.y }
				}
			};
		};

		if (ax < 0.5) {
			if (ay < 0.5) {
				this.children[0] = processQuadrant(
					this.children[0],
					computeQuadrantContext({ x: 0, y: 0 })
				);
			}

			if (by > 0.5) {
				this.children[2] = processQuadrant(
					this.children[2],
					computeQuadrantContext({ x: 0, y: 1 })
				);
			}
		}

		if (bx > 0.5) {
			if (ay < 0.5) {
				this.children[1] = processQuadrant(
					this.children[1],
					computeQuadrantContext({ x: 1, y: 0 })
				);
			}

			if (by > 0.5) {
				this.children[3] = processQuadrant(
					this.children[3],
					computeQuadrantContext({ x: 1, y: 1 })
				);
			}
		}
	}

	getDescendantTilesInBounds(rect: LTRBRect): Tile<T>[] {
		const result: Tile<T>[] = [];

		this.processQuadrants(
			(quadrant, context) => {
				if (quadrant instanceof TreeTileNode) {
					result.push(quadrant);
				} else if (quadrant instanceof TreeContainerNode) {
					if (context.localRect) {
						result.push(...quadrant.getDescendantTilesInBounds(context.localRect));
					} else {
						result.push(...quadrant.selfOrDescendants);
					}
				}
				return quadrant;
			},
			{ rect: rect }
		);

		return result;
	}

	populate(options: PopulateContainerOptions<T>): Tile<T>[] {
		const { dataProvider, levelOffset, rect } = options;
		const result: Tile<T>[] = [];

		this.processQuadrants(
			(quadrant, context) => {
				if (!quadrant) {
					const childPosition: Vector = {
						x: this.position.x * 2 + context.positionInContainer.x,
						y: this.position.y * 2 + context.positionInContainer.y
					};

					if (levelOffset >= 0) {
						quadrant = new TreeTileNode<T>(
							dataProvider.createTile(this.level - 1, childPosition),
							this.level - 1,
							childPosition
						);
					} else {
						quadrant = new TreeContainerNode<T>(this.level - 1, childPosition);
					}
				}

				if (quadrant instanceof TreeTileNode) {
					if (levelOffset >= 0) {
						result.push(quadrant);
					} else {
						// This leaf quadrant needs to have further subdivisions
						const replacementNode = quadrant.toContainerNode(dataProvider.subdivideTile(quadrant));
						dataProvider.disposeTile(quadrant);

						quadrant = replacementNode;
					}
				}

				if (quadrant instanceof TreeContainerNode) {
					result.push(
						...quadrant.populate({
							dataProvider: dataProvider,
							levelOffset: levelOffset + 1,
							rect: context.localRect
						})
					);
				}

				return quadrant;
			},
			{ rect: rect }
		);

		return result;
	}
}

class TreeTileNode<T> extends TreeNode<T> implements Tile<T> {
	readonly data: T;

	constructor(data: T, level: number, position: Vector) {
		super(level, position);
		this.data = data;
	}

	override get selfOrDescendants(): Tile<T>[] {
		return [this];
	}

	toContainerNode(quadrantData: QuadrantTuple<T>): TreeContainerNode<T> {
		const childLevel = this.level - 1;
		const { x, y } = Vectors.scale(this.position, 2);

		return new TreeContainerNode<T>(this.level, this.position, [
			quadrantData[0] !== null ? new TreeTileNode(quadrantData[0], childLevel, { x, y }) : null,
			quadrantData[1] !== null
				? new TreeTileNode(quadrantData[1], childLevel, { x: x + 1, y: y })
				: null,
			quadrantData[2] !== null
				? new TreeTileNode(quadrantData[2], childLevel, { x: x, y: y + 1 })
				: null,
			quadrantData[3] !== null
				? new TreeTileNode(quadrantData[3], childLevel, { x: x + 1, y: y + 1 })
				: null
		]);
	}
}
