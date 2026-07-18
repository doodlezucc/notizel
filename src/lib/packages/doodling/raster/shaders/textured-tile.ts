import { describeWebGLProgram } from '../../webgl/program/program';

const VERTEX_SHADER_SRC = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_uv;

  uniform mat3 u_viewProjection;
  uniform float u_instanceLevel;
  uniform vec2 u_instancePosition;

  out vec2 v_uv;
  
  void main() {
    v_uv = a_uv;
    
    float scale = exp2(u_instanceLevel);
    vec2 worldPosition = a_position * scale + u_instancePosition;
    vec3 clip = u_viewProjection * vec3(worldPosition * 256.0, 1.0);

    gl_Position = vec4(clip.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;
  
  uniform sampler2D u_texture;
  
  void main() {
    outColor = texture(u_texture, v_uv);
    outColor = vec4(v_uv, 0.0, 1.0);
  }
`;

export const shaderTexturedTile = describeWebGLProgram({
	vertexShaderSource: VERTEX_SHADER_SRC,
	fragmentShaderSource: FRAGMENT_SHADER_SRC,
	// TODO: Instead of string lookups, prefer hardcoding the attribute locations here.
	attributes: {
		position: 'a_position',
		uv: 'a_uv'
	},
	uniforms: {
		viewProjection: 'u_viewProjection',
		instanceLevel: 'u_instanceLevel',
		instancePosition: 'u_instancePosition',
		texture: 'u_texture'
	}
});
