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
	},
	distance: (a: Vector, b: Vector): number => {
		const x = b.x - a.x;
		const y = b.y - a.y;
		return Math.sqrt(x * x + y * y);
	},
	interpolate: (a: Vector, b: Vector, t: number): Vector => {
		return {
			x: a.x + t * (b.x - a.x),
			y: a.y + t * (b.y - a.y)
		};
	}
};
