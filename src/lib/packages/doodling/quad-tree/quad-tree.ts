import type { Vector } from '$lib/data/common';

type Coord = `${number};${number}`;

function tileCoord(x: number, y: number): Coord {
	return `${x};${y}`;
}

interface LTRBRect {
	topLeft: Vector;
	bottomRight: Vector;
}

interface PopulateOptions<T> {
	detailLevel: number;
	createTileData: (level: number, position: Vector) => T;
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

	populateTilesOverlappingRect(rect: LTRBRect, options: PopulateOptions<T>): T[] {}

	findTilesOverlappingRect(rect: LTRBRect): T[] {
		const result: T[] = [];

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
							...node.getDescendantDataInBounds({
								topLeft: {
									x: minX - minTileX - x,
									y: minY - minTileY - y
								},
								bottomRight: {
									x: maxX - minTileX - x,
									y: maxY - minTileY - y
								}
							})
						);
					} else {
						result.push(...node.selfOrDescendantData);
					}
				}
			}
		}

		return result;
	}
}

abstract class TreeNode<T> {
	readonly level: number;
	/** Integer coordinates from the origin, unique in this `level`. */
	readonly position: Vector;

	constructor(level: number, position: Vector) {
		this.level = level;
		this.position = position;
	}

	abstract get selfOrDescendantData(): T[];
}

type CornerTuple<T> = [topLeft?: T, topRight?: T, bottomLeft?: T, bottomRight?: T];

class TreeContainerNode<T> extends TreeNode<T> {
	private readonly children: CornerTuple<TreeNode<T>>;

	constructor(level: number, position: Vector, children?: CornerTuple<TreeNode<T>>) {
		super(level, position);
		this.children = children ?? [undefined, undefined, undefined, undefined];
	}

	override get selfOrDescendantData(): T[] {
		const result: T[] = [];

		for (const child of this.children) {
			if (child) {
				result.push(...child.selfOrDescendantData);
			}
		}

		return result;
	}

	setChild(x: number, y: number, node: TreeNode<T>) {
		this.children[x + y * 2] = node;
	}

	private processQuadrantsOverlappingRect(
		rect: LTRBRect,
		processQuadrant: (node: TreeNode<T> | undefined, localRect: LTRBRect) => void
	) {
		const {
			topLeft: { x: ax, y: ay },
			bottomRight: { x: bx, y: by }
		} = rect;

		if (ax > 1 || ay > 1 || bx < 0 || by < 0) {
			return;
		}

		if (ax <= 0 && ay <= 0 && bx >= 1 && by >= 1) {
			for (const child of this.children) {
				processQuadrant(child, rect);
			}
			return;
		}

		if (ax < 0.5) {
			if (ay < 0.5) {
				processQuadrant(this.children[0], {
					topLeft: { x: ax * 2, y: ay * 2 },
					bottomRight: { x: bx * 2, y: by * 2 }
				});
			}

			if (by > 0.5) {
				processQuadrant(this.children[2], {
					topLeft: { x: ax * 2, y: ay * 2 - 0.5 },
					bottomRight: { x: bx * 2, y: by * 2 - 0.5 }
				});
			}
		}

		if (bx > 0.5) {
			if (ay < 0.5) {
				processQuadrant(this.children[1], {
					topLeft: { x: ax * 2 - 0.5, y: ay * 2 },
					bottomRight: { x: bx * 2 - 0.5, y: by * 2 }
				});
			}

			if (by > 0.5) {
				processQuadrant(this.children[3], {
					topLeft: { x: ax * 2 - 0.5, y: ay * 2 - 0.5 },
					bottomRight: { x: bx * 2 - 0.5, y: by * 2 - 0.5 }
				});
			}
		}
	}

	getDescendantDataInBounds(rect: LTRBRect): T[] {
		const result: T[] = [];

		const processQuadrant = (quadrant: TreeNode<T> | undefined, localRect: LTRBRect) => {
			if (quadrant instanceof TreeTileNode) {
				result.push(quadrant.data);
			} else if (quadrant instanceof TreeContainerNode) {
				quadrant.processQuadrantsOverlappingRect(localRect, processQuadrant);
			}
		};

		this.processQuadrantsOverlappingRect(rect, processQuadrant);

		return result;
	}

	populate(options: PopulateOptions<T>) {}
}

class TreeTileNode<T> extends TreeNode<T> {
	readonly data: T;

	constructor(data: T, level: number, position: Vector) {
		super(level, position);
		this.data = data;
	}

	override get selfOrDescendantData(): T[] {
		return [this.data];
	}
}
