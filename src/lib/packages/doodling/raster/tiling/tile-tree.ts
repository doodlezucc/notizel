import { QuadTree, type LTRBRect, type QuadrantTuple, type Tile } from '../../quad-tree/quad-tree';
import { GLResource } from '../../webgl/resource';
import { TextureTile } from './texture-tile';

export class TileTree extends GLResource {
	private readonly quadTree = new QuadTree<TextureTile>();
	private readonly readableFramebuffer = this.gl.createFramebuffer();
	private readonly writableFramebuffer = this.gl.createFramebuffer();

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
		const gl = this.gl;
		const halfTileTextureSize = TextureTile.size >> 1;

		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.readableFramebuffer);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.writableFramebuffer);

		const result = this.quadTree.populateTilesOverlappingRect(rect, {
			targetLevel: targetLevel,
			dataProvider: {
				createTile: () => {
					return new TextureTile(this.gl);
				},
				disposeTile: (tile) => {
					tile.data.destroy();
				},
				subdivideTile: (parent) => {
					// Attach parent texture to framebuffer for reading/copying
					gl.framebufferTexture2D(
						gl.READ_FRAMEBUFFER,
						gl.COLOR_ATTACHMENT0,
						gl.TEXTURE_2D,
						parent.data.texture,
						0
					);

					const result = [
						new TextureTile(gl),
						new TextureTile(gl),
						new TextureTile(gl),
						new TextureTile(gl)
					] as QuadrantTuple<TextureTile>;

					for (let x = 0; x < 2; x++) {
						for (let y = 0; y < 2; y++) {
							const quadrant = result[x + y * 2]!;

							gl.framebufferTexture2D(
								gl.DRAW_FRAMEBUFFER,
								gl.COLOR_ATTACHMENT0,
								gl.TEXTURE_2D,
								quadrant.texture,
								0
							);
							gl.blitFramebuffer(
								// Source bottom left
								...[x * halfTileTextureSize, y * halfTileTextureSize],
								// Source top right
								...[(x + 1) * halfTileTextureSize, (y + 1) * halfTileTextureSize],
								// Destination bounds
								...[0, 0, TextureTile.size, TextureTile.size],
								gl.COLOR_BUFFER_BIT,
								gl.LINEAR
							);
						}
					}

					return result;
				}
			}
		});

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return result;
	}
}
