interface WebGLProgramDescription {
	vertexShaderSource: string;
	fragmentShaderSource: string;
	attributes?: Record<string, string>;
	uniforms?: Record<string, string>;
}

interface WebGLProgramInfo<
	TAttribute extends PropertyKey = PropertyKey,
	TUniform extends PropertyKey = PropertyKey
> {
	program: WebGLProgram;
	attributes: Record<TAttribute, GLint>;
	uniforms: Record<TUniform, WebGLUniformLocation>;
}

export type WebGLProgramOf<T extends WebGLProgramDescription> = NoInfer<
	WebGLProgramInfo<keyof T['attributes'], keyof T['uniforms']>
>;

export function describeWebGLProgram<T extends WebGLProgramDescription>(description: T): T {
	return description;
}

export function createWebGLProgram<T extends WebGLProgramDescription>(
	gl: WebGL2RenderingContext,
	description: T
) {
	const { fragmentShaderSource, vertexShaderSource, attributes = {}, uniforms = {} } = description;

	const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

	const result = {
		program: program,
		attributes: {},
		uniforms: {}
	} as WebGLProgramOf<T>;

	// Find named attribute locations
	for (const [nameInJs, nameInShader] of Object.entries(attributes)) {
		const location = gl.getAttribLocation(program, nameInShader);

		if (location < 0) {
			gl.deleteProgram(program);
			throw new Error(`Attribute ${nameInShader} not found in shader program`);
		}

		result.attributes[nameInJs as keyof T['attributes']] = location;
	}

	// Find named uniform locations
	for (const [nameInJs, nameInShader] of Object.entries(uniforms)) {
		const location = gl.getUniformLocation(program, nameInShader);

		if (!location) {
			gl.deleteProgram(program);
			throw new Error(`Uniform ${nameInShader} not found in shader program`);
		}

		result.uniforms[nameInJs as keyof T['uniforms']] = location;
	}

	return result;
}

function compileShader(
	gl: WebGL2RenderingContext,
	type: typeof gl.VERTEX_SHADER | typeof gl.FRAGMENT_SHADER,
	source: string
): WebGLShader {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error('Failed to create shader');
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Shader compile error: ${info ?? 'unknown error'}`);
	}

	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	vertexShaderSource: string,
	fragmentShaderSource: string
): WebGLProgram {
	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	const program = gl.createProgram();

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Program link error: ${info ?? 'unknown error'}`);
	}

	return program;
}
