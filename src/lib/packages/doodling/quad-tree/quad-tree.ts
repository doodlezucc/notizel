import type { AxisAlignedBoundingBox, Vector } from '$lib/data/common';

type Coord = `${number};${number}`;

function tileCoord(x: number, y: number): Coord {
	return `${x};${y}`;
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

	findTilesOverlappingBox(box: AxisAlignedBoundingBox): T[] {
		const result: T[] = [];

		const rootTileSize = Math.pow(2, this.rootLevel);
		const inverseRootTileSize = 1 / rootTileSize;

		const minX = box.topLeft.x * inverseRootTileSize;
		const minY = box.topLeft.y * inverseRootTileSize;
		const maxX = box.bottomRight.x * inverseRootTileSize;
		const maxY = box.bottomRight.y * inverseRootTileSize;

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
							...node.getDescendantDataInBounds(
								minX - minTileX - x,
								minY - minTileY - y,
								maxX - minTileX - x,
								maxY - minTileY - y
							)
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

	private getChildDataOrDescendants(
		index: number,
		computeDescendants: (container: TreeContainerNode<T>) => T[]
	): T[] {
		const child = this.children[index];

		if (child instanceof TreeTileNode) {
			return [child.data];
		} else if (child instanceof TreeContainerNode) {
			return computeDescendants(child as TreeContainerNode<T>);
		} else {
			return [];
		}
	}

	setChild(x: number, y: number, node: TreeNode<T>) {
		this.children[x + y * 2] = node;
	}

	getDescendantDataInBounds(ax: number, ay: number, bx: number, by: number): T[] {
		if (ax > 1 || ay > 1 || bx < 0 || by < 0) {
			return [];
		}

		if (ax <= 0 && ay <= 0 && bx >= 1 && by >= 1) {
			return this.selfOrDescendantData;
		}

		const result: T[] = [];

		if (ax < 0.5) {
			if (ay < 0.5) {
				result.push(
					...this.getChildDataOrDescendants(0, (container) =>
						container.getDescendantDataInBounds(ax * 2, ay * 2, bx * 2, by * 2)
					)
				);
			}

			if (by > 0.5) {
				result.push(
					...this.getChildDataOrDescendants(2, (container) =>
						container.getDescendantDataInBounds(ax * 2, ay * 2 - 0.5, bx * 2, by * 2 - 0.5)
					)
				);
			}
		}

		if (bx > 0.5) {
			if (ay < 0.5) {
				result.push(
					...this.getChildDataOrDescendants(1, (container) =>
						container.getDescendantDataInBounds(ax * 2 - 0.5, ay * 2, bx * 2 - 0.5, by * 2)
					)
				);
			}

			if (by > 0.5) {
				result.push(
					...this.getChildDataOrDescendants(3, (container) =>
						container.getDescendantDataInBounds(
							ax * 2 - 0.5,
							ay * 2 - 0.5,
							bx * 2 - 0.5,
							by * 2 - 0.5
						)
					)
				);
			}
		}

		return result;
	}
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
