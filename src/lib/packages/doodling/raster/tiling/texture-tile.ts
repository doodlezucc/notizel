import { GLResource, type GL } from '../../webgl/resource';

export class TextureTile extends GLResource {
	static readonly size = 256;

	readonly texture: WebGLTexture;

	constructor(gl: GL) {
		super(gl);

		this.texture = gl.createTexture();
	}

	override destroy() {
		this.gl.deleteTexture(this.texture);
	}

	prepareForFramebufferWrite() {
		const gl = this.gl;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
	}
}
