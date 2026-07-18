import { QuadTree, type LTRBRect, type Tile } from '../../quad-tree/quad-tree';
import type { GL } from '../../webgl/resource';
import { TextureTile } from './texture-tile';

export class TileTree {
	private readonly gl: GL;
	private readonly quadTree = new QuadTree<TextureTile>();

	constructor(gl: GL) {
		this.gl = gl;
	}

	destroy() {
		// TODO!
		// for (const tile of this.quadTree) {
		// 	tile.destroy();
		// }
	}

	findTilesOverlappingRect(rect: LTRBRect): Tile<TextureTile>[] {
		return this.quadTree.findTilesOverlappingRect(rect);
	}

	populateTilesOverlappingRect(rect: LTRBRect, targetLevel: number): Tile<TextureTile>[] {
		return this.quadTree.populateTilesOverlappingRect(rect, {
			targetLevel: targetLevel,
			dataProvider: {
				createTile: () => {
					return new TextureTile(this.gl);
				},
				disposeTile: (tile) => {
					tile.data.destroy();
				},
				// TODO: Paint parent tile onto quadrants
				subdivideTile: () => {
					return [
						new TextureTile(this.gl),
						new TextureTile(this.gl),
						new TextureTile(this.gl),
						new TextureTile(this.gl)
					];
				}
			}
		});
	}
}
