import type { Size } from '$lib/data/common';
import { GLResource, type GL } from '../resource';

export class GLDrawableTexture extends GLResource {
	readonly texture: WebGLTexture;
	private readonly framebuffer: WebGLFramebuffer;

	constructor(gl: GL, size: Size) {
		super(gl);
		this.texture = GLDrawableTexture.createTexture(gl, size);
		this.framebuffer = GLDrawableTexture.createFramebuffer(gl, this.texture);
	}

	override destroy() {
		this.gl.deleteFramebuffer(this.framebuffer);
		this.gl.deleteTexture(this.texture);
	}

	bindFramebuffer() {
		const gl = this.gl;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	}

	clear() {
		this.bindFramebuffer();

		this.gl.clearColor(0, 0, 0, 0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}

	private static createTexture(gl: WebGL2RenderingContext, size: Size) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		this.resizeCurrentTexture(gl, size);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		return texture;
	}

	private static resizeCurrentTexture(gl: WebGL2RenderingContext, size: Size) {
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			size.width,
			size.height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null
		);
	}

	private static createFramebuffer(gl: WebGL2RenderingContext, texture: WebGLTexture) {
		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		return framebuffer;
	}
}
