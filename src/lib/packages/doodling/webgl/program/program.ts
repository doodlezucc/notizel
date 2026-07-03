import { GLResource, type GL } from '../resource';
import { createWebGLProgram } from './create-program';

interface WebGLProgramDescription {
	vertexShaderSource: string;
	fragmentShaderSource: string;
	attributes?: Record<string, string>;
	uniforms?: Record<string, string>;
}

interface GLProgramLocations<
	TAttribute extends PropertyKey = PropertyKey,
	TUniform extends PropertyKey = PropertyKey
> {
	attributes: Record<TAttribute, GLint>;
	uniforms: Record<TUniform, WebGLUniformLocation>;
}

export type GLProgramOf<T extends WebGLProgramDescription> = NoInfer<
	GLProgram<keyof T['attributes'], keyof T['uniforms']>
>;

export type GLProgramLocationsOf<T extends WebGLProgramDescription> = NoInfer<
	GLProgramLocations<keyof T['attributes'], keyof T['uniforms']>
>;

export function describeWebGLProgram<T extends WebGLProgramDescription>(description: T): T {
	return description;
}

type UniformsConfiguration<T extends PropertyKey> = Record<
	T,
	(location: WebGLUniformLocation) => void
>;

export class GLProgram<
	TAttribute extends PropertyKey = PropertyKey,
	TUniform extends PropertyKey = PropertyKey
> extends GLResource {
	private readonly program: WebGLProgram;
	readonly attributes: Record<TAttribute, GLint>;
	readonly uniforms: Record<TUniform, WebGLUniformLocation>;

	constructor(gl: GL, program: WebGLProgram, locations: GLProgramLocations<TAttribute, TUniform>) {
		super(gl);
		this.program = program;
		this.attributes = locations.attributes;
		this.uniforms = locations.uniforms;
	}

	static create<T extends WebGLProgramDescription>(gl: GL, description: T) {
		const {
			fragmentShaderSource,
			vertexShaderSource,
			attributes = {},
			uniforms = {}
		} = description;

		const program = createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource);
		const locations = { attributes: {}, uniforms: {} } as GLProgramLocationsOf<T>;

		// Find named attribute locations
		for (const [nameInJs, nameInShader] of Object.entries(attributes)) {
			const location = gl.getAttribLocation(program, nameInShader);

			if (location < 0) {
				gl.deleteProgram(program);
				throw new Error(`Attribute ${nameInShader} not found in shader program`);
			}

			locations.attributes[nameInJs as keyof T['attributes']] = location;
		}

		// Find named uniform locations
		for (const [nameInJs, nameInShader] of Object.entries(uniforms)) {
			const location = gl.getUniformLocation(program, nameInShader);

			if (!location) {
				gl.deleteProgram(program);
				throw new Error(`Uniform ${nameInShader} not found in shader program`);
			}

			locations.uniforms[nameInJs as keyof T['uniforms']] = location;
		}

		return new GLProgram(gl, program, locations);
	}

	bindProgram(uniforms: UniformsConfiguration<TUniform>) {
		this.gl.useProgram(this.program);

		for (const name in uniforms) {
			const configure = uniforms[name];
			configure(this.uniforms[name]);
		}
	}

	override destroy(): void {
		this.gl.deleteProgram(this.program);
	}
}
