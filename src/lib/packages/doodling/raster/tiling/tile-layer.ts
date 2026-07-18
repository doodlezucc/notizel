import type { CameraTransform, Size, Vector } from '$lib/data/common';
import type { GLGeometryShaderBinding } from '../../webgl/geometry/geometry-shader-binding';
import { GLQuad } from '../../webgl/geometry/quad';
import { GLProgram, type GLProgramOf } from '../../webgl/program/program';
import type { GL } from '../../webgl/resource';
import { Layer } from '../layer';
import { shaderTexturedTile } from '../shaders/textured-tile';
import { TextureTile } from './texture-tile';
import { TileTree } from './tile-tree';

export interface OverlayedTexture {
	texture: WebGLTexture;
	topLeft: Vector;
	size: Size;
	resolution: Size;
}

interface DoodleSnapshot {}

export class TileLayer extends Layer {
	private readonly tileTree = new TileTree(this.gl);
	private readonly texturedTileProgram: GLProgramOf<typeof shaderTexturedTile>;

	private readonly quad0To1: GLQuad;
	private readonly clipSpaceQuadUnlitVAO: GLGeometryShaderBinding;
	// private readonly tileInstanceBuffer: WebGLBuffer;

	constructor(gl: GL) {
		super(gl);
		this.quad0To1 = new GLQuad(gl, { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 } });
		this.texturedTileProgram = GLProgram.create(gl, shaderTexturedTile);
		this.clipSpaceQuadUnlitVAO = this.quad0To1.createShaderBinding({
			position: this.texturedTileProgram.attributes.position,
			uv: this.texturedTileProgram.attributes.uv
		});

		this.tileTree.populateTilesOverlappingRect(
			{
				topLeft: { x: -1000 / TextureTile.size, y: -1000 / TextureTile.size },
				bottomRight: { x: 1000 / TextureTile.size, y: 1000 / TextureTile.size }
			},
			0
		);

		// this.tileInstanceBuffer = gl.createBuffer();
		// this.initializeTileInstanceBuffer();
	}

	// On top of the quad geometry buffer (initialized with createShaderBinding(...)),
	// this function adds bindings to another buffer to the VAO, which includes individual
	// transforms for each quad/tile.
	// private initializeTileInstanceBuffer() {
	// 	const gl = this.gl;

	// 	this.clipSpaceQuadUnlitVAO.bindVertexArray();
	// 	gl.bindBuffer(gl.ARRAY_BUFFER, this.tileInstanceBuffer);

	// 	const loc = this.unlitTextureTransformedProgram.attributes;

	// 	const bytesPosition = 2 * Float32Array.BYTES_PER_ELEMENT;
	// 	const bytesScale = Float32Array.BYTES_PER_ELEMENT;
	// 	const stride = bytesPosition + bytesScale;

	// 	gl.enableVertexAttribArray(loc.instancePosition);
	// 	gl.vertexAttribPointer(loc.instancePosition, bytesPosition, gl.FLOAT, false, stride, 0);
	// 	gl.vertexAttribDivisor(loc.instancePosition, 1);

	// 	gl.enableVertexAttribArray(loc.instanceScale);
	// 	gl.vertexAttribPointer(loc.instanceScale, bytesScale, gl.FLOAT, false, stride, bytesPosition);
	// 	gl.vertexAttribDivisor(loc.instanceScale, 1);
	// }

	destroy() {
		this.tileTree.destroy();
		this.texturedTileProgram.destroy();
		this.clipSpaceQuadUnlitVAO.destroy();
	}

	paintTextureToTiles(overlayedTexture: OverlayedTexture): DoodleSnapshot {
		return {};
	}

	restoreSnapshot(snapshot: DoodleSnapshot) {
		throw new Error('Oh noes, not implemented :(');
	}

	render(camera: CameraTransform, viewport: Size): void {
		const halfWidthPixels = viewport.width / camera.scale / 2;
		const halfHeightPixels = viewport.height / camera.scale / 2;

		const visibleTiles = this.tileTree.findTilesOverlappingRect({
			topLeft: {
				x: (-camera.position.x - halfWidthPixels) / TextureTile.size,
				y: (camera.position.y - halfHeightPixels) / TextureTile.size
			},
			bottomRight: {
				x: (-camera.position.x + halfWidthPixels) / TextureTile.size,
				y: (camera.position.y + halfHeightPixels) / TextureTile.size
			}
		});

		if (visibleTiles.length === 0) {
			return;
		}

		const gl = this.gl;

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		const sx = (2 * camera.scale) / viewport.width;
		const sy = (2 * camera.scale) / viewport.height;
		// prettier-ignore
		const viewProjectionMatrix = new Float32Array([
			sx, 0,  0,
			0,  sy, 0,
			camera.position.x * sx, -camera.position.y * sy, 1
		]);

		this.clipSpaceQuadUnlitVAO.bindVertexArray();
		this.texturedTileProgram.bindProgram({
			texture: (loc) => gl.uniform1i(loc, 0),
			viewProjection: (loc) => gl.uniformMatrix3fv(loc, false, viewProjectionMatrix)
		});
		gl.activeTexture(gl.TEXTURE0);

		// // Update per-instance buffer

		// const floatsPerTile = 3; // Level + position
		// const tileInstanceBufferData = new Float32Array(visibleTiles.length * floatsPerTile);

		// for (let i = 0; i < visibleTiles.length; i++) {
		// 	const tile = visibleTiles[i];
		// 	const offset = i * floatsPerTile;
		// 	tileInstanceBufferData[offset] = tile.level;
		// 	tileInstanceBufferData[offset + 1] = tile.position.x;
		// 	tileInstanceBufferData[offset + 2] = tile.position.y;
		// }

		// // TODO: bufferData(...) is wasteful as it allocates GPU memory of the specified size.
		// // Instead, use bufferSubData(...), keep track of capacity, grow buffer if needed
		// gl.bindBuffer(gl.ARRAY_BUFFER, this.tileInstanceBuffer);
		// gl.bufferData(gl.ARRAY_BUFFER, tileInstanceBufferData.byteLength, gl.DYNAMIC_DRAW);

		const uniforms = this.texturedTileProgram.uniforms;

		for (let i = 0; i < visibleTiles.length; i++) {
			const tile = visibleTiles[i];

			gl.uniform1f(uniforms.instanceLevel, tile.level);
			gl.uniform2f(uniforms.instancePosition, tile.position.x, tile.position.y);

			gl.bindTexture(gl.TEXTURE_2D, tile.data.texture);

			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
	}
}
