export type GL = WebGL2RenderingContext;

export abstract class GLResource {
	protected readonly gl: GL;

	constructor(gl: GL) {
		this.gl = gl;
	}

	abstract destroy(): void;
}

export type UnbindFunction = () => void;

export function glBindResources(resources: UnbindFunction[], body: () => void) {
	try {
		body();
	} finally {
		for (const unbind of resources) {
			unbind();
		}
	}
}
