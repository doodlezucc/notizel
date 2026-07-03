import { GLResource, type GL } from '../resource';

export class GLGeometryShaderBinding extends GLResource {
	private readonly vao: WebGLVertexArrayObject;

	constructor(gl: GL, initialize: () => void) {
		super(gl);

		this.vao = gl.createVertexArray();

		this.gl.bindVertexArray(this.vao);
		initialize();
	}

	bindVertexArray() {
		this.gl.bindVertexArray(this.vao);
	}

	override destroy(): void {
		this.gl.deleteVertexArray(this.vao);
	}
}
