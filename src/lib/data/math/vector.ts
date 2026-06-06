export interface Vector {
	x: number;
	y: number;
}

export const Vectors = {
	add: (a: Vector, b: Vector): Vector => {
		return { x: a.x + b.x, y: a.y + b.y };
	},
	subtract: (a: Vector, b: Vector): Vector => {
		return { x: a.x - b.x, y: a.y - b.y };
	},
	scale: ({ x, y }: Vector, scale: number): Vector => {
		return { x: x * scale, y: y * scale };
	},
	negate: ({ x, y }: Vector): Vector => {
		return { x: -x, y: -y };
	}
};
