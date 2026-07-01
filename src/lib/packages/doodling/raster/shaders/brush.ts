import { describeWebGLProgram } from '../../util/webgl-program';

const VERTEX_SHADER_SRC = `#version 300 es
  in vec2 a_position;
  in vec2 a_uv;

  out vec2 v_uv;
  
  void main() {
    v_uv = a_uv;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
  precision highp float;
  out vec4 outColor;

  in vec2 v_uv;

  uniform vec4 u_color;
  
  void main() {
    float dist = length(v_uv - vec2(0.5, 0.5));

    float alpha = smoothstep(0.5, 0.45, dist);
    outColor = vec4(u_color.rgb, u_color.a * alpha);
  }
`;

export const shaderBrush = describeWebGLProgram({
	vertexShaderSource: VERTEX_SHADER_SRC,
	fragmentShaderSource: FRAGMENT_SHADER_SRC,
	attributes: {
		position: 'a_position',
		uv: 'a_uv'
	},
	uniforms: {
		color: 'u_color'
	}
});
