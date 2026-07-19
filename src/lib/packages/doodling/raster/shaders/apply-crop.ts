import { describeWebGLProgram } from '../../webgl/program/program';

const VERTEX_SHADER_SRC = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_uv;

  uniform vec2 u_origin;
  uniform vec2 u_size;

  out vec2 v_uv;
  
  void main() {
    v_uv = vec2(a_uv.x, 1.0 - a_uv.y);
    
    vec2 clip = (u_origin + a_position * u_size) * 2.0 - 1.0;

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
  }
`;

export const shaderApplyCrop = describeWebGLProgram({
	vertexShaderSource: VERTEX_SHADER_SRC,
	fragmentShaderSource: FRAGMENT_SHADER_SRC,
	attributes: {
		position: 'a_position',
		uv: 'a_uv'
	},
	uniforms: {
		origin: 'u_origin',
		size: 'u_size',
		texture: 'u_texture'
	}
});
