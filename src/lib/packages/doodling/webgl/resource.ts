export type GL = WebGL2RenderingContext;

export abstract class GLResource {
	protected readonly gl: GL;

	constructor(gl: GL) {
		this.gl = gl;
	}

	abstract destroy(): void;
}
