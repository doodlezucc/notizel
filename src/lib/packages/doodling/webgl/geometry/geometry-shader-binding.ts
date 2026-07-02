import { GLResource, type GL, type UnbindFunction } from '../resource';

export class GLGeometryShaderBinding extends GLResource {
	private readonly vao: WebGLVertexArrayObject;

	constructor(gl: GL, initialize: () => void) {
		super(gl);

		this.vao = gl.createVertexArray();

		this.gl.bindVertexArray(this.vao);
		initialize();
		this.gl.bindVertexArray(null);
	}

	bindVertexArray(): UnbindFunction {
		this.gl.bindVertexArray(this.vao);
		return () => this.gl.bindVertexArray(null);
	}

	override destroy(): void {
		this.gl.deleteVertexArray(this.vao);
	}
}
